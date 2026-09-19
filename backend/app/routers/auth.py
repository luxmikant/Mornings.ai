from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Dict, Any
from jose import jwt
from datetime import datetime, timedelta
from app.config import get_settings

router = APIRouter(prefix="/auth", tags=["auth"])

class SendOTPRequest(BaseModel):
    phone_number: str

class VerifyOTPRequest(BaseModel):
    phone_number: str
    otp_code: str

@router.post("/otp/send", response_model=Dict[str, str])
async def send_otp(request: SendOTPRequest):
    # Stub: skip actual SMS for MVP
    return {"message": "OTP sent successfully"}

@router.post("/otp/verify", response_model=Dict[str, str])
async def verify_otp(request: VerifyOTPRequest, settings = Depends(get_settings)):
    if len(request.otp_code) != 6:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP code format")
    
    # Generate JWT
    to_encode = {"sub": request.phone_number}
    expire = datetime.utcnow() + timedelta(days=7)
    to_encode.update({"exp": expire})
    # Fallback secret key if not configured in settings
    secret_key = getattr(settings, "secret_key", "default_secret_key_for_testing")
    encoded_jwt = jwt.encode(to_encode, secret_key, algorithm="HS256")
    
    return {"access_token": encoded_jwt, "token_type": "bearer"}
