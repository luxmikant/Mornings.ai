from fastapi import APIRouter, Depends, HTTPException, status, Header, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from uuid import UUID
import uuid

from app.database import get_db
from app.schemas import UserOnboardRequest, UserOnboardResponse, UserProfileResponse, PreferenceProfileResponse, ProfileUpdateRequest, UserUpdateRequest
from app.models import User, PreferenceProfile

router = APIRouter(prefix="/users", tags=["users"])

async def get_current_user_id(x_user_id: str = Header(..., alias="X-User-ID")) -> UUID:
    try:
        return uuid.UUID(x_user_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid X-User-ID header format")

@router.post("/onboard", response_model=UserOnboardResponse, status_code=status.HTTP_201_CREATED)
async def onboard_user(
    request: UserOnboardRequest = Depends(),
    portrait: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db)
):
    # Stub: portrait service
    portrait_url = "https://example.com/stub-portrait.png" if portrait else None
    
    user = User(phone_number=request.phone_number, full_name=request.full_name, portrait_url=portrait_url)
    db.add(user)
    await db.flush()
    
    profile = PreferenceProfile(user_id=user.id)
    db.add(profile)
    await db.commit()
    await db.refresh(user)
    
    return UserOnboardResponse(user_id=user.id, message="User onboarded successfully")

@router.get("/me", response_model=UserProfileResponse)
async def get_user_me(user_id: UUID = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

@router.get("/me/profile", response_model=PreferenceProfileResponse)
async def get_user_profile(user_id: UUID = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PreferenceProfile).where(PreferenceProfile.user_id == user_id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return profile

@router.get("/me/portrait")
async def get_user_portrait(user_id: UUID = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return {"portrait_url": user.portrait_url}

@router.patch("/me/profile", response_model=PreferenceProfileResponse)
async def update_user_profile(
    request: ProfileUpdateRequest,
    user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(PreferenceProfile).where(PreferenceProfile.user_id == user_id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    
    for key, value in request.model_dump(exclude_unset=True).items():
        setattr(profile, key, value)
    
    await db.commit()
    await db.refresh(profile)
    return profile

@router.patch("/me", response_model=UserProfileResponse)
async def update_user(
    request: UserUpdateRequest,
    user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    for key, value in request.model_dump(exclude_unset=True).items():
        setattr(user, key, value)
    
    await db.commit()
    await db.refresh(user)
    return user

@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: UUID = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    await db.delete(user)
    await db.commit()
