from pathlib import Path
from ultralytics import YOLO

model = YOLO("runs/plate_detector_v2/weights/best.pt")
test_dir = Path("dataset/test/images")

confidences = []
no_detection = 0

for img_path in test_dir.glob("*.jpg"):
    results = model(img_path, verbose=False)[0]
    if len(results.boxes) == 0:
        no_detection += 1
        continue
    for box in results.boxes:
        confidences.append(float(box.conf[0]))

if confidences:
    print(f"Total deteksi: {len(confidences)}")
    print(f"Gambar tanpa deteksi: {no_detection}")
    print(f"Confidence rata-rata: {sum(confidences)/len(confidences):.3f}")
    print(f"Confidence minimum: {min(confidences):.3f}")
    print(f"Confidence maximum: {max(confidences):.3f}")

    below_04 = sum(1 for c in confidences if c < 0.4)
    below_07 = sum(1 for c in confidences if c < 0.7)
    print(f"Jumlah confidence < 0.4: {below_04} ({below_04/len(confidences)*100:.1f}%)")
    print(f"Jumlah confidence < 0.7: {below_07} ({below_07/len(confidences)*100:.1f}%)")
else:
    print("Tidak ada deteksi sama sekali")
