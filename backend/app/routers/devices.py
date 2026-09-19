from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
import uuid

from app.database import get_db
from app.schemas import FCMTokenRequest
from app.models import User

router = APIRouter(prefix="/device", tags=["devices"])

async def get_current_user_id(x_user_id: str = Header(..., alias="X-User-ID")) -> UUID:
    try:
        return uuid.UUID(x_user_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid X-User-ID header format")

@router.post("/fcm-token")
async def update_fcm_token(
    request: FCMTokenRequest,
    user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    user.fcm_device_token = request.token
    await db.commit()
    
    return {"message": "FCM token updated successfully"}

@router.delete("/fcm-token/{token}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_fcm_token(
    token: str,
    user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    if user.fcm_device_token == token:
        user.fcm_device_token = None
        await db.commit()
