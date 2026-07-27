import re
from pathlib import Path
import os
import cv2
from ultralytics import YOLO
from paddleocr import PaddleOCR
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
detector = YOLO(str(PROJECT_ROOT / "ml/plate_detection/runs/plate_detector_v2/weights/best.pt"))
ocr = PaddleOCR(lang="en")

CONF_THRESHOLD = 0.4


def clean_plate_text(raw_text):
    cleaned = re.sub(r"[^A-Za-z0-9]", "", raw_text)
    if len(cleaned) > 12:
        return None
    if cleaned.isalpha():
        return None
    if len(cleaned) < 4:
        return None
    return cleaned.upper()


def find_or_create_vehicle(plate_text):
    existing = supabase.table("vehicles").select("id").eq("plate_number", plate_text).execute()

    if existing.data and len(existing.data) > 0:
        return existing.data[0]["id"]

    new_vehicle = supabase.table("vehicles").insert({
        "plate_number": plate_text,
        "vehicle_type": "truck",
    }).execute()

    return new_vehicle.data[0]["id"]


def log_plate_detection(vehicle_id, camera_id, raw_text, cleaned_text, confidence):
    supabase.table("plate_detection_logs").insert({
        "vehicle_id": vehicle_id,
        "camera_id": camera_id,
        "raw_ocr_text": raw_text,
        "cleaned_plate_text": cleaned_text,
        "detection_confidence": confidence,
    }).execute()


def detect_and_log_plate(image_path, camera_id):
    image = cv2.imread(str(image_path))
    results = detector(image_path)[0]

    outputs = []

    for box in results.boxes:
        conf = float(box.conf[0])
        if conf < CONF_THRESHOLD:
            continue

        x1, y1, x2, y2 = map(int, box.xyxy[0])
        cropped = image[y1:y2, x1:x2]
        cropped = cv2.resize(cropped, None, fx=3, fy=3, interpolation=cv2.INTER_CUBIC)

        ocr_result = ocr.predict(cropped)
        raw_text = ""
        if ocr_result and len(ocr_result) > 0:
            texts = ocr_result[0].get("rec_texts", [])
            raw_text = " ".join(texts)

        cleaned_text = clean_plate_text(raw_text)

        if cleaned_text is None:
            log_plate_detection(None, camera_id, raw_text, None, conf)
            outputs.append({"status": "unreadable", "confidence": round(conf, 3), "raw_text": raw_text})
            continue

        vehicle_id = find_or_create_vehicle(cleaned_text)
        log_plate_detection(vehicle_id, camera_id, raw_text, cleaned_text, conf)

        outputs.append({
            "status": "detected",
            "plate_text": cleaned_text,
            "confidence": round(conf, 3),
            "vehicle_id": vehicle_id,
        })

    return outputs


if __name__ == "__main__":
    import sys
    if len(sys.argv) != 3:
        print("Cara pakai: python3 pipeline_db.py <path_foto> <camera_id>")
        sys.exit(1)

    results = detect_and_log_plate(sys.argv[1], sys.argv[2])
    for r in results:
        print(r)
