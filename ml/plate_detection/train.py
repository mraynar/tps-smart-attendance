from pathlib import Path
from ultralytics import YOLO

def main():
    project_root = Path(__file__).resolve().parent.parent.parent

    model = YOLO("yolo26s.pt")

    model.train(
        data=str(project_root / "ml/plate_detection/dataset/data.yaml"),
        epochs=100,
        imgsz=640,
        batch=16,
        device="mps",
        project=str(project_root / "ml/plate_detection/runs"),
        name="plate_detector_v2",
        patience=20,
    )

if __name__ == "__main__":
    main()
