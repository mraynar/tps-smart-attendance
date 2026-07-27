from pathlib import Path
import numpy as np
import cv2
import onnxruntime as ort
import insightface

app = insightface.app.FaceAnalysis(name="buffalo_l")
app.prepare(ctx_id=0)

MODEL_DIR = Path(__file__).resolve().parent
LIVENESS_MODEL_PATH = MODEL_DIR / "model_archive" / "MiniFASNetV2.onnx"
ENROLLED_DIR = MODEL_DIR / "enrolled"

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


def cosine_similarity(a, b):
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


def load_enrolled_faces():
    enrolled = {}
    for npy_file in ENROLLED_DIR.glob("*.npy"):
        enrolled[npy_file.stem] = np.load(npy_file)
    return enrolled


def recognize_embedding(embedding, enrolled):
    best_match, best_score = None, -1
    for name, ref_embedding in enrolled.items():
        score = cosine_similarity(embedding, ref_embedding)
        if score > best_score:
            best_score, best_match = score, name
    return best_match, best_score


def process_attendance(image_path):
    image = cv2.imread(str(image_path))
    faces = app.get(image)

    if len(faces) == 0:
        return [{"status": "no_face", "message": "Tidak ada wajah terdeteksi"}]

    enrolled = load_enrolled_faces()
    results = []

    for face in faces:
        is_real, liveness_score = check_liveness(image, face.bbox)

        if not is_real:
            results.append({
                "status": "rejected_spoof",
                "liveness_score": round(liveness_score, 3),
                "message": "Ditolak: terdeteksi sebagai spoof/foto, bukan wajah asli",
            })
            continue

        name, sim_score = recognize_embedding(face.embedding, enrolled)

        if sim_score >= RECOGNITION_THRESHOLD:
            results.append({
                "status": "recognized",
                "name": name,
                "similarity": round(sim_score, 3),
                "liveness_score": round(liveness_score, 3),
            })
        else:
            results.append({
                "status": "unrecognized",
                "similarity": round(sim_score, 3),
                "liveness_score": round(liveness_score, 3),
                "message": "Wajah asli terdeteksi tapi tidak dikenali (bukan pegawai/sopir terdaftar)",
            })

    return results


if __name__ == "__main__":
    import sys
    if len(sys.argv) != 2:
        print("Cara pakai: python3 attendance_pipeline.py <path_foto>")
        sys.exit(1)

    results = process_attendance(sys.argv[1])
    for r in results:
        print(r)
