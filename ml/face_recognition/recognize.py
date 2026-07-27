import sys
from pathlib import Path
import numpy as np
import cv2
import insightface

app = insightface.app.FaceAnalysis(name="buffalo_l")
app.prepare(ctx_id=0)

SIMILARITY_THRESHOLD = 0.5


def cosine_similarity(a, b):
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


def load_enrolled_faces(enrolled_dir):
    enrolled = {}
    for npy_file in Path(enrolled_dir).glob("*.npy"):
        name = npy_file.stem
        enrolled[name] = np.load(npy_file)
    return enrolled


def recognize_face(image_path, enrolled_dir):
    image = cv2.imread(str(image_path))
    faces = app.get(image)

    if len(faces) == 0:
        print("Tidak ada wajah terdeteksi di gambar ini")
        return

    enrolled = load_enrolled_faces(enrolled_dir)
    if not enrolled:
        print("Belum ada data enrollment sama sekali")
        return

    for i, face in enumerate(faces):
        best_match = None
        best_score = -1
        for name, ref_embedding in enrolled.items():
            score = cosine_similarity(face.embedding, ref_embedding)
            if score > best_score:
                best_score = score
                best_match = name

        if best_score >= SIMILARITY_THRESHOLD:
            print(f"Wajah #{i+1}: dikenali sebagai '{best_match}' (similarity: {best_score:.3f})")
        else:
            print(f"Wajah #{i+1}: TIDAK DIKENALI (similarity tertinggi: {best_score:.3f} ke '{best_match}')")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Cara pakai: python3 recognize.py <path_foto_baru>")
        sys.exit(1)

    image_path = sys.argv[1]
    enrolled_dir = Path(__file__).resolve().parent / "enrolled"
    recognize_face(image_path, enrolled_dir)
