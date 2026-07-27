import re
from pathlib import Path
from ultralytics import YOLO
from paddleocr import PaddleOCR
import cv2

project_root = Path(__file__).resolve().parent.parent.parent
detector = YOLO(str(project_root / "ml/plate_detection/runs/plate_detector_v2/weights/best.pt"))
ocr = PaddleOCR(lang="en")

CONF_THRESHOLD = 0.7
CROP_MARGIN = 0


def clean_plate_text(raw_text):
    cleaned = re.sub(r"[^A-Za-z0-9]", "", raw_text)
    if len(cleaned) > 12:
        return None
    if cleaned.isalpha():
        return None
    if len(cleaned) < 4:
        return None
    return cleaned.upper()


def detect_and_read_plate(image_path):
    image = cv2.imread(str(image_path))
    results = detector(image_path)[0]
    plates_text = []

    for box in results.boxes:
        conf = float(box.conf[0])
        if conf < CONF_THRESHOLD:
            continue

        x1, y1, x2, y2 = map(int, box.xyxy[0])
        x1, y1 = x1 + CROP_MARGIN, y1 + CROP_MARGIN
        x2, y2 = x2 - CROP_MARGIN, y2 - CROP_MARGIN

        cropped = image[y1:y2, x1:x2]
        cropped = cv2.resize(cropped, None, fx=3, fy=3, interpolation=cv2.INTER_CUBIC)

        ocr_result = ocr.predict(cropped)
        raw_text = ""
        if ocr_result and len(ocr_result) > 0:
            texts = ocr_result[0].get("rec_texts", [])
            raw_text = " ".join(texts)

        clean_text = clean_plate_text(raw_text)

        plates_text.append({
            "bbox": (x1, y1, x2, y2),
            "confidence": round(conf, 3),
            "raw_text": raw_text,
            "plate_text": clean_text,
        })

    return plates_text


if __name__ == "__main__":
    test_dir = project_root / "ml/plate_detection/dataset/test/images"
    for sample_image in list(test_dir.glob("*.jpg"))[:5]:
        print(f"--- {sample_image.name} ---")
        hasil = detect_and_read_plate(sample_image)
        for p in hasil:
            print(f"  conf={p['confidence']} raw='{p['raw_text']}' -> plate='{p['plate_text']}'")
