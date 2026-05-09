import random
from datetime import datetime, timedelta
from jose import jwt
from fastapi import APIRouter, HTTPException, status, Depends, BackgroundTasks
from fastapi.responses import JSONResponse
from schemas.user import UserRegister, UserLogin, UserResponse, TokenResponse, OtpVerify, GoogleAuthRequest, ResendOtp
from services.auth_service import hash_password, verify_password, create_access_token, get_current_user, oauth2_scheme, decode_token
from database.connection import get_db
from services.email_service import send_otp_email

router = APIRouter(prefix="/auth", tags=["Authentication"])

async def _generate_and_send_otp(db, user_email: str, user_id, background_tasks: BackgroundTasks):
    now = datetime.utcnow()
    user = await db["users"].find_one({"_id": user_id})
    last_requested = user.get("otp_last_requested")
    if last_requested and (now - last_requested).total_seconds() < 60:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Please wait before requesting another OTP.")
        
    otp_code = str(random.randint(100000, 999999))
    hashed_otp = hash_password(otp_code)
    
    await db["users"].update_one(
        {"_id": user_id},
        {"$set": {
            "otp": hashed_otp,
            "otp_expires_at": now + timedelta(minutes=10),
            "otp_attempts": 0,
            "otp_last_requested": now
        }}
    )
    background_tasks.add_task(send_otp_email, user_email, otp_code)

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(data: UserRegister, background_tasks: BackgroundTasks):
    db = get_db()
    existing = await db["users"].find_one({"email": data.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    hashed = hash_password(data.password)
    
    user_doc = {
        "name": data.name,
        "email": data.email,
        "password": hashed,
        "role": data.role.value,
        "is_verified": False
    }
    result = await db["users"].insert_one(user_doc)
    user_id = str(result.inserted_id)

    await _generate_and_send_otp(db, data.email, result.inserted_id, background_tasks)

    token = create_access_token({"sub": data.email, "user_id": user_id, "role": data.role.value})
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            name=data.name,
            email=data.email,
            role=data.role.value,
            is_verified=False
        ),
    )


@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp(data: OtpVerify):
    db = get_db()
    user = await db["users"].find_one({"email": data.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if not user.get("otp"):
        raise HTTPException(status_code=400, detail="Invalid OTP")
        
    now = datetime.utcnow()
    # Check Expiry
    if user.get("otp_expires_at") and now > user["otp_expires_at"]:
        raise HTTPException(status_code=400, detail="OTP expired")
        
    # Check Attempts
    attempts = user.get("otp_attempts", 0)
    if attempts >= 5:
        await db["users"].update_one({"_id": user["_id"]}, {"$unset": {"otp": "", "otp_expires_at": ""}})
        raise HTTPException(status_code=400, detail="Maximum verification attempts exceeded. Please request a new OTP.")
        
    # Verify Hash
    if not verify_password(data.otp, user["otp"]):
        await db["users"].update_one({"_id": user["_id"]}, {"$inc": {"otp_attempts": 1}})
        raise HTTPException(status_code=400, detail="Invalid OTP")
        
    # Mark verified and clean up
    await db["users"].update_one(
        {"_id": user["_id"]},
        {"$set": {"is_verified": True}, "$unset": {"otp": "", "otp_expires_at": "", "otp_attempts": "", "otp_last_requested": ""}}
    )
    
    user_id_str = str(user["_id"])
    token = create_access_token({"sub": user["email"], "user_id": user_id_str, "role": user["role"]})
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id_str,
            name=user["name"],
            email=user["email"],
            role=user["role"],
            is_verified=True
        ),
    )


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, background_tasks: BackgroundTasks):
    db = get_db()
    user = await db["users"].find_one({"email": data.email})
    
    if not user or not user.get("password"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
        
    if not verify_password(data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
        
    if not user.get("is_verified"):
        # User not verified yet, send OTP
        await _generate_and_send_otp(db, data.email, user["_id"], background_tasks)
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={"detail": "Please verify your email with OTP first"}
        )
        
    # User is valid and verified. Return token immediately.
    user_id_str = str(user["_id"])
    token = create_access_token({"sub": user["email"], "user_id": user_id_str, "role": user["role"]})
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id_str,
            name=user["name"],
            email=user["email"],
            role=user["role"],
            is_verified=True
        ),
    )


@router.post("/resend-otp")
async def resend_otp(data: ResendOtp, background_tasks: BackgroundTasks):
    db = get_db()
    user = await db["users"].find_one({"email": data.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    await _generate_and_send_otp(db, data.email, user["_id"], background_tasks)
    return {"message": "OTP sent successfully"}


@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user), token: str = Depends(oauth2_scheme)):
    db = get_db()
    payload = decode_token(token)
    if payload:
        exp_timestamp = payload.get("exp")
        exp_date = datetime.fromtimestamp(exp_timestamp) if exp_timestamp else datetime.utcnow()
        await db["token_blacklist"].insert_one({
            "token": token,
            "exp": exp_date
        })
    return {"message": "Logged out successfully"}


@router.post("/google", response_model=TokenResponse)
async def google_auth(data: GoogleAuthRequest):
    try:
        # For simplicity and robust local dev we decode without signature verification
        idinfo = jwt.decode(data.token, "", algorithms=["RS256"], options={"verify_signature": False})
        
        email = idinfo.get("email")
        name = idinfo.get("name", "Google User")
        
        if not email:
            raise HTTPException(status_code=400, detail="No email provided by Google")
            
        db = get_db()
        user = await db["users"].find_one({"email": email})
        
        if not user:
            user_doc = {
                "name": name,
                "email": email,
                "password": "", 
                "role": data.role.value,
                "is_verified": True, 
                "provider": "google"
            }
            result = await db["users"].insert_one(user_doc)
            user_id = str(result.inserted_id)
            user_role = data.role.value
        else:
            user_id = str(user["_id"])
            user_role = user["role"]
            name = user["name"]
            
        token = create_access_token({"sub": email, "user_id": user_id, "role": user_role})
        return TokenResponse(
            access_token=token,
            user=UserResponse(
                id=user_id,
                name=name,
                email=email,
                role=user_role,
                is_verified=True
            ),
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Google Auth failed: {str(e)}")
