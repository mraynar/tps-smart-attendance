"""Endpoint admin untuk manajemen akun pegawai/sopir."""

from fastapi import APIRouter, HTTPException

from app.schemas.user_management import CreateUserAccountRequest, CreateUserAccountResponse
from app.services.user_management import create_user_account, UserCreationError

router = APIRouter(prefix="/api/users", tags=["users"])


@router.post("", response_model=CreateUserAccountResponse)
async def create_user(request: CreateUserAccountRequest) -> CreateUserAccountResponse:
    """Admin membuat akun login baru untuk pegawai/sopir."""
    try:
        result = create_user_account(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except UserCreationError as e:
        raise HTTPException(status_code=500, detail=str(e)) from e

    return CreateUserAccountResponse(**result)
