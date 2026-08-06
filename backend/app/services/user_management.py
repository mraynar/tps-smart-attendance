"""Logic pembuatan akun login untuk pegawai/sopir (dibuat admin).

Alur:
1. Buat user baru di auth.users (Supabase Admin API), email langsung
   dikonfirmasi (email_confirm=True) karena sistem email produksi
   belum di-setup — admin bisa langsung berikan akun ke pegawai.
2. Buat baris persons, terhubung ke auth_user_id dari langkah 1.
3. Buat baris employee_details atau driver_details sesuai person_type.

Kalau langkah 2 atau 3 gagal, langkah sebelumnya di-rollback (hapus
auth.users dan/atau persons yang sudah terlanjur dibuat), supaya tidak
ada akun "setengah jadi" nyangkut di database.
"""

import os
from typing import Optional

from dotenv import load_dotenv
from supabase import create_client, Client

from app.schemas.user_management import CreateUserAccountRequest, PersonType

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

DUPLICATE_EMAIL_MARKERS = ("already registered", "already exists", "already been registered")


class UserCreationError(Exception):
    """Dilempar kalau proses pembuatan akun gagal di langkah manapun."""


def create_user_account(request: CreateUserAccountRequest) -> dict:
    """Buat akun login + baris persons + detail sesuai tipe orang.

    Returns:
        dict berisi person_id, auth_user_id, dan email yang dibuat.

    Raises:
        ValueError: kalau email sudah terdaftar sebelumnya.
        UserCreationError: kalau ada langkah lain yang gagal (sudah di-rollback).
    """
    auth_user_id: Optional[str] = None
    person_id: Optional[str] = None

    try:
        auth_response = supabase.auth.admin.create_user({
            "email": request.email,
            "password": request.password,
            "email_confirm": True,
        })
        auth_user_id = auth_response.user.id
    except Exception as e:
        if any(marker in str(e).lower() for marker in DUPLICATE_EMAIL_MARKERS):
            raise ValueError(f"Email '{request.email}' sudah terdaftar") from e
        raise UserCreationError(f"Gagal membuat akun login: {e}") from e

    try:
        person_res = supabase.table("persons").insert({
            "person_type": request.person_type.value,
            "full_name": request.full_name,
            "phone_number": request.phone_number,
            "auth_user_id": auth_user_id,
        }).execute()
        person_id = person_res.data[0]["id"]

        if request.person_type == PersonType.employee:
            supabase.table("employee_details").insert({
                "person_id": person_id,
                "employee_id": request.employee_id,
                "department": request.department,
                "position": request.position,
            }).execute()
        else:
            supabase.table("driver_details").insert({
                "person_id": person_id,
                "license_number": request.license_number,
                "company_name": request.company_name,
                "company_phone": request.company_phone,
            }).execute()

    except Exception as e:
        _rollback(auth_user_id, person_id)
        raise UserCreationError(f"Gagal melengkapi data akun: {e}") from e

    return {
        "person_id": person_id,
        "auth_user_id": auth_user_id,
        "email": request.email,
    }


def _rollback(auth_user_id: Optional[str], person_id: Optional[str]) -> None:
    """Hapus data yang sudah terlanjur dibuat kalau ada langkah yang gagal."""
    if person_id is not None:
        try:
            supabase.table("persons").delete().eq("id", person_id).execute()
        except Exception as cleanup_error:
            print(f"PERINGATAN: gagal rollback baris persons {person_id}: {cleanup_error}")

    if auth_user_id is not None:
        try:
            supabase.auth.admin.delete_user(auth_user_id)
        except Exception as cleanup_error:
            print(f"PERINGATAN: gagal rollback auth user {auth_user_id}: {cleanup_error}")
