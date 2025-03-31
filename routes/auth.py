from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from datetime import timedelta
from slowapi.util import get_remote_address
from models import User
from auth import authenticate_user, create_access_token, hash_password, get_current_user
from database import get_db
from schemas import LoginRequest, RegisterRequest
from rate_limiter import limiter 
import re

def is_strong_password(password: str) -> bool:
    return (
        len(password) >= 8 and
        re.search(r"[A-Z]", password) and
        re.search(r"[a-z]", password) and
        re.search(r"[0-9]", password) and
        re.search(r"[^A-Za-z0-9]", password)
    )

router = APIRouter()

@router.post("/register", status_code=201)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    if not is_strong_password(request.password):
        raise HTTPException(status_code=400, detail="Password too weak")
    existing_user = db.query(User).filter(User.username == request.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")

    hashed_password = hash_password(request.password)
    new_user = User(username=request.username, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    return {"message": "User created successfully"}

@router.post("/token")
@limiter.limit("5/minute")
async def login(
    request: Request,                         # FastAPI Request objektum
    payload: LoginRequest,                    
    db: Session = Depends(get_db)
):
    # Brute-force védelem
    limiter = request.app.state.limiter

    # Bejelentkezési logika
    user = authenticate_user(payload.username, payload.password, db)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect username or password")

    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me")
def read_users_me(current_user: User = Depends(get_current_user)):
    return {"username": current_user.username}
