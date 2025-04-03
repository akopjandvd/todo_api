from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Task
from auth import get_current_user
from pydantic import BaseModel
from typing import List
from schemas import TaskCreate, TaskUpdate, TaskResponse

router = APIRouter()




def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=TaskResponse)
def create_task(task: TaskCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    print("User:", user)  # Ha nincs token, akkor ez 403-at dob
    new_task = Task(title=task.title, description=task.description, completed=task.completed,
                     due_date=task.due_date, priority=task.priority, tags=task.tags, pinned=task.pinned, owner_id=user.id)
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

@router.get("/", response_model=List[TaskResponse])
def get_tasks(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return db.query(Task)\
        .filter(Task.owner_id == user.id)\
        .order_by(Task.pinned.desc(), Task.priority.desc(), Task.due_date.asc())\
        .all()

@router.put("/{task_id}", response_model=TaskResponse)
def update_task(task_id: int, updated_task: TaskUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    task = db.query(Task).filter(Task.id == task_id, Task.owner_id == user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task.title = updated_task.title
    task.description = updated_task.description
    task.completed = updated_task.completed
    task.due_date = updated_task.due_date 
    task.priority = updated_task.priority
    task.tags = updated_task.tags
    task.pinned = updated_task.pinned


    db.commit()
    db.refresh(task)
    return task

@router.delete("/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    task = db.query(Task).filter(Task.id == task_id, Task.owner_id == user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()
    return {"message": "Task deleted"}
