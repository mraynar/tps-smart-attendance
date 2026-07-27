import sys
from pathlib import Path
import numpy as np
import cv2
import insightface

app = insightface.app.FaceAnalysis(name="buffalo_l")
app.prepare(ctx_id=0)


def get_embedding_from_image(image_path):
    image = cv2.imread(str(image_path))
    if image is None:
        print(f"Gagal baca gambar: {image_path}, dilewati")
        return None

    faces = app.get(image)
    if len(faces) == 0:
        print(f"Tidak ada wajah terdeteksi di {image_path}, dilewati")
        return None

    face = max(faces, key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]))
    return face.embedding


def enroll_face(image_paths, person_name):
    embeddings = []
    for path in image_paths:
        emb = get_embedding_from_image(path)
        if emb is not None:
            embeddings.append(emb)

    if len(embeddings) == 0:
        raise ValueError("Tidak ada foto valid untuk di-enroll")

    avg_embedding = np.mean(embeddings, axis=0)
    print(f"Enrollment berhasil: {person_name} (dari {len(embeddings)}/{len(image_paths)} foto valid)")
    return avg_embedding


def enroll_driver(full_name, license_number=None, company_name=None,
                   company_phone=None, phone_number=None, image_paths=None):
    person_res = supabase.table("persons").insert({
        "person_type": "driver",
        "full_name": full_name,
        "phone_number": phone_number,
    }).execute()
    person_id = person_res.data[0]["id"]

    supabase.table("driver_details").insert({
        "person_id": person_id,
        "license_number": license_number,
        "company_name": company_name,
        "company_phone": company_phone,
    }).execute()

    embeddings = []
    for path in image_paths:
        emb = get_embedding_from_image(path)
        if emb is not None:
            embeddings.append(emb)

    if len(embeddings) == 0:
        raise ValueError("Tidak ada foto valid, enrollment dibatalkan")

    avg_embedding = np.mean(embeddings, axis=0)
    supabase.table("face_embeddings").insert({
        "person_id": person_id,
        "embedding": avg_embedding.tolist(),
        "model_name": "buffalo_l",
        "is_primary": True,
    }).execute()

    print(f"Enrollment sopir berhasil: {full_name} (person_id: {person_id})")
    return person_id

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Cara pakai: python3 enroll.py <nama_orang> <foto1> <foto2> ...")
        sys.exit(1)

    person_name = sys.argv[1]
    image_paths = sys.argv[2:]
    embedding = enroll_face(image_paths, person_name)

    output_dir = Path(__file__).resolve().parent / "enrolled"
    output_dir.mkdir(exist_ok=True)
    np.save(output_dir / f"{person_name}.npy", embedding)
    print(f"Disimpan ke: {output_dir / f'{person_name}.npy'}")
