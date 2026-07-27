from pathlib import Path
import os
import numpy as np
import cv2
import onnxruntime as ort
import insightface
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

app = insightface.app.FaceAnalysis(name="buffalo_l")
app.prepare(ctx_id=0)

MODEL_DIR = Path(__file__).resolve().parent
LIVENESS_MODEL_PATH = MODEL_DIR / "model_archive" / "MiniFASNetV2.onnx"

LIVENESS_CROP_SCALE = 2.7
LIVENESS_THRESHOLD = 0.7
RECOGNITION_THRESHOLD = 0.5

liveness_session = ort.InferenceSession(str(LIVENESS_MODEL_PATH), providers=["CPUExecutionProvider"])
liveness_input_name = liveness_session.get_inputs()[0].name
liveness_input_size = tuple(liveness_session.get_inputs()[0].shape[2:])
liveness_output_name = liveness_session.get_outputs()[0].name


def crop_face_for_liveness(image, bbox_xyxy, scale=LIVENESS_CROP_SCALE):
    x1, y1, x2, y2 = bbox_xyxy
    box_w, box_h = x2 - x1, y2 - y1
    src_h, src_w = image.shape[:2]

    s = min((src_h - 1) / box_h, (src_w - 1) / box_w, scale)
    new_w, new_h = box_w * s, box_h * s
    center_x, center_y = x1 + box_w / 2, y1 + box_h / 2

    cx1 = max(0, int(center_x - new_w / 2))
    cy1 = max(0, int(center_y - new_h / 2))
    cx2 = min(src_w - 1, int(center_x + new_w / 2))
    cy2 = min(src_h - 1, int(center_y + new_h / 2))

    cropped = image[cy1:cy2 + 1, cx1:cx2 + 1]
    return cv2.resize(cropped, liveness_input_size[::-1])


def softmax(x):
    e_x = np.exp(x - np.max(x, axis=1, keepdims=True))
    return e_x / e_x.sum(axis=1, keepdims=True)


def check_liveness(image, bbox):
    cropped = crop_face_for_liveness(image, bbox)
    input_tensor = cropped.astype(np.float32)
    input_tensor = np.transpose(input_tensor, (2, 0, 1))
    input_tensor = np.expand_dims(input_tensor, axis=0)

    outputs = liveness_session.run([liveness_output_name], {liveness_input_name: input_tensor})
    probs = softmax(outputs[0])

    label_idx = int(np.argmax(probs))
    score = float(probs[0, label_idx])
    is_real = (label_idx == 1) and (score >= LIVENESS_THRESHOLD)

    return is_real, score


def find_closest_person(embedding):
    result = supabase.rpc("match_face", {
        "query_embedding": embedding.tolist(),
        "match_threshold": RECOGNITION_THRESHOLD,
    }).execute()

    if result.data and len(result.data) > 0:
        best = result.data[0]
        return best["person_id"], best["full_name"], best["similarity"]

    return None, None, 0.0


def log_attendance(person_id, camera_id, status, similarity_score, liveness_score):
    supabase.table("attendance_logs").insert({
        "person_id": person_id,
        "camera_id": camera_id,
        "status": status,
        "similarity_score": similarity_score,
        "liveness_score": liveness_score,
    }).execute()


def process_attendance(image_path, camera_id):
    image = cv2.imread(str(image_path))
    faces = app.get(image)

    if len(faces) == 0:
        return [{"status": "no_face", "message": "Tidak ada wajah terdeteksi"}]

    results = []

    for face in faces:
        is_real, liveness_score = check_liveness(image, face.bbox)

        if not is_real:
            log_attendance(None, camera_id, "rejected_spoof", None, liveness_score)
            results.append({"status": "rejected_spoof", "liveness_score": round(liveness_score, 3)})
            continue

        person_id, full_name, similarity = find_closest_person(face.embedding)

        if person_id:
            log_attendance(person_id, camera_id, "recognized", similarity, liveness_score)
            results.append({
                "status": "recognized",
                "name": full_name,
                "similarity": round(similarity, 3),
                "liveness_score": round(liveness_score, 3),
            })
        else:
            log_attendance(None, camera_id, "unrecognized", similarity, liveness_score)
            results.append({
                "status": "unrecognized",
                "similarity": round(similarity, 3),
                "liveness_score": round(liveness_score, 3),
            })

    return results


if __name__ == "__main__":
    import sys
    if len(sys.argv) != 3:
        print("Cara pakai: python3 attendance_pipeline_db.py <path_foto> <camera_id>")
        sys.exit(1)

    results = process_attendance(sys.argv[1], sys.argv[2])
    for r in results:
        print(r)
