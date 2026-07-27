import sys
from pathlib import Path
import numpy as np
import cv2
import onnxruntime as ort
import insightface

app = insightface.app.FaceAnalysis(name="buffalo_l")
app.prepare(ctx_id=0)

MODEL_PATH = Path(__file__).resolve().parent / "model_archive" / "MiniFASNetV2.onnx"
CROP_SCALE = 2.7

session = ort.InferenceSession(str(MODEL_PATH), providers=["CPUExecutionProvider"])
input_name = session.get_inputs()[0].name
input_size = tuple(session.get_inputs()[0].shape[2:])
output_name = session.get_outputs()[0].name


def crop_face(image, bbox_xyxy, scale=CROP_SCALE):
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
    return cv2.resize(cropped, input_size[::-1])


def softmax(x):
    e_x = np.exp(x - np.max(x, axis=1, keepdims=True))
    return e_x / e_x.sum(axis=1, keepdims=True)


def check_liveness(image_path):
    image = cv2.imread(str(image_path))
    faces = app.get(image)

    if len(faces) == 0:
        print("Tidak ada wajah terdeteksi")
        return []

    results = []
    for face in faces:
        bbox = face.bbox
        cropped = crop_face(image, bbox)

        input_tensor = cropped.astype(np.float32)
        input_tensor = np.transpose(input_tensor, (2, 0, 1))
        input_tensor = np.expand_dims(input_tensor, axis=0)

        outputs = session.run([output_name], {input_name: input_tensor})
        probs = softmax(outputs[0])

        label_idx = int(np.argmax(probs))
        score = float(probs[0, label_idx])
        label = "Real" if label_idx == 1 else "Fake"

        results.append({"label": label, "score": score, "bbox": bbox})
        print(f"Liveness: {label} (confidence: {score:.3f})")

    return results


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Cara pakai: python3 liveness.py <path_foto>")
        sys.exit(1)

    check_liveness(sys.argv[1])
