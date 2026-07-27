import sys
from pathlib import Path
import shutil
import tempfile

from fastapi import FastAPI, UploadFile, File, Form, HTTPException

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "ml" / "face_recognition"))
sys.path.insert(0, str(PROJECT_ROOT / "ml" / "plate_detection"))

from attendance_pipeline_db import process_attendance
from pipeline_db import detect_and_log_plate

from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from enroll_db import enroll_employee, enroll_driver

app = FastAPI(title="TPS Smart Attendance API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def save_upload_to_temp(file: UploadFile) -> Path:
    suffix = Path(file.filename).suffix or ".jpg"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(file.file, tmp)
        return Path(tmp.name)


@app.post("/api/attendance/detect")
async def attendance_detect(camera_id: str = Form(...), image: UploadFile = File(...)):
    temp_path = save_upload_to_temp(image)
    try:
        results = process_attendance(temp_path, camera_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        temp_path.unlink(missing_ok=True)

    return {"results": results}


@app.post("/api/plate/detect")
async def plate_detect(camera_id: str = Form(...), image: UploadFile = File(...)):
    temp_path = save_upload_to_temp(image)
    try:
        results = detect_and_log_plate(temp_path, camera_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        temp_path.unlink(missing_ok=True)

    return {"results": results}

@app.post("/api/enroll")
async def enroll(
    person_type: str = Form(...),  # "employee" atau "driver"
    full_name: str = Form(...),
    phone_number: Optional[str] = Form(None),
    employee_id: Optional[str] = Form(None),
    department: Optional[str] = Form(None),
    position: Optional[str] = Form(None),
    license_number: Optional[str] = Form(None),
    company_name: Optional[str] = Form(None),
    company_phone: Optional[str] = Form(None),
    images: List[UploadFile] = File(...),
):
    temp_paths = [save_upload_to_temp(img) for img in images]
    try:
        if person_type == "employee":
            if not employee_id:
                raise HTTPException(status_code=400, detail="employee_id wajib diisi untuk pegawai")
            person_id = enroll_employee(full_name, employee_id, temp_paths, department, position)
        elif person_type == "driver":
            person_id = enroll_driver(full_name, license_number, company_name, company_phone, phone_number, temp_paths)
        else:
            raise HTTPException(status_code=400, detail="person_type harus 'employee' atau 'driver'")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        for p in temp_paths:
            p.unlink(missing_ok=True)

    return {"person_id": person_id, "message": "Enrollment berhasil"}

@app.get("/health")
async def health():
    return {"status": "ok"}
