from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class TechnicianCreate(BaseModel):
    """Model for creating a new technician (no ID needed from client)"""
    code_name: str
    skills: List[str]


class Technician(BaseModel):
    """Full technician model (includes ID and active_tasks)"""
    id: str
    code_name: str
    skills: List[str]
    active_tasks: int = 0


class TaskCreate(BaseModel):
    task_type: str
    required_skill: str
    priority: str
    assigned_to: Optional[str] = None


class Task(BaseModel):
    """Full task model"""
    id: str
    task_type: str
    required_skill: str
    priority: str  # Routine | Urgent | Emergency
    status: str = "pending"
    assigned_to: Optional[str] = None
