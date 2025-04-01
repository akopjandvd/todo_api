from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from enum import Enum

class RegisterRequest(BaseModel):
    username: str
    password: str

class LoginRequest(BaseModel):
    username: str
    password: str

class PriorityEnum(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"

class TaskBase(BaseModel):
    title: str
    description: str
    due_date: Optional[datetime] = None
    priority: PriorityEnum = PriorityEnum.medium
    tags: Optional[str] = "" 
    pinned: Optional[bool] = False


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = Field(None, max_length=300)
    completed: bool = False
    due_date: Optional[datetime] = None
    priority: Optional[PriorityEnum]
    tags: Optional[str] = "" 
    pinned: Optional[bool] = False


class TaskUpdate(BaseModel):
    title: str
    description: Optional[str] = Field(None, max_length=300)
    completed: Optional[bool] = None
    due_date: Optional[datetime] = None
    priority: Optional[PriorityEnum]
    tags: Optional[str] = "" 
    pinned: Optional[bool] = False


class TaskResponse(TaskBase):
    id: int
    completed: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True) 