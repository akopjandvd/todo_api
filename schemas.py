from datetime import datetime
from pydantic import BaseModel
from typing import Optional

class RegisterRequest(BaseModel):
    username: str
    password: str

class LoginRequest(BaseModel):
    username: str
    password: str

class TaskBase(BaseModel):
    title: str
    description: str
    due_date: Optional[datetime] = None

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    completed: bool = False
    due_date: Optional[datetime] = None

class TaskUpdate(BaseModel):
    title: str
    description: Optional[str] = None
    completed: Optional[bool] = None
    due_date: Optional[datetime] = None

class TaskResponse(TaskBase):
    id: int
    completed: bool
    created_at: datetime

    class Config:
        from_attributes = True 