import sys
from pathlib import Path
import numpy as np
import cv2
import insightface
from supabase import create_client
from dotenv import load_dotenv
import os

load_dotenv()
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

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


def enroll_employee(full_name, employee_id, image_paths, department=None, position=None):
    person_res = supabase.table("persons").insert({
        "person_type": "employee",
        "full_name": full_name,
    }).execute()
    person_id = person_res.data[0]["id"]

    supabase.table("employee_details").insert({
        "person_id": person_id,
        "employee_id": employee_id,
        "department": department,
        "position": position,
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

    print(f"Enrollment berhasil: {full_name} (person_id: {person_id})")
    print(f"   Dari {len(embeddings)}/{len(image_paths)} foto valid")
    return person_id


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
    if len(sys.argv) < 4:
        print("Cara pakai: python3 enroll_db.py <nama_lengkap> <employee_id> <foto1> <foto2> ...")
        sys.exit(1)
    full_name = sys.argv[1]
    employee_id = sys.argv[2]
    image_paths = sys.argv[3:]
    enroll_employee(full_name, employee_id, image_paths)
