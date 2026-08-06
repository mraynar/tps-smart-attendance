"""Schema Pydantic untuk fitur manajemen akun pegawai/sopir (dibuat admin)."""

from enum import Enum
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, model_validator

MIN_PASSWORD_LENGTH = 8


class PersonType(str, Enum):
    """Tipe orang, harus sinkron dengan enum person_type di database."""

    employee = "employee"
    driver = "driver"


class CreateUserAccountRequest(BaseModel):
    """Request admin untuk membuat akun login baru bagi pegawai/sopir.

    Membuat baris di auth.users, persons, dan employee_details/driver_details
    sekaligus (terhubung lewat kolom persons.auth_user_id).
    """

    full_name: str = Field(..., min_length=1, max_length=200)
    email: EmailStr
    password: str = Field(
        ...,
        min_length=MIN_PASSWORD_LENGTH,
        description="Password sementara, disarankan diganti user setelah login pertama",
    )
    person_type: PersonType
    phone_number: Optional[str] = None

    # Wajib diisi kalau person_type == employee
    employee_id: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None

    # Opsional, khusus person_type == driver
    license_number: Optional[str] = None
    company_name: Optional[str] = None
    company_phone: Optional[str] = None

    @model_validator(mode="after")
    def validate_type_specific_fields(self) -> "CreateUserAccountRequest":
        """Pastikan employee_id terisi kalau tipe orangnya pegawai."""
        if self.person_type == PersonType.employee and not self.employee_id:
            raise ValueError("employee_id wajib diisi untuk person_type 'employee'")
        return self


class CreateUserAccountResponse(BaseModel):
    """Response setelah akun pegawai/sopir berhasil dibuat."""

    person_id: str
    auth_user_id: str
    email: EmailStr
    message: str = "Akun berhasil dibuat"
