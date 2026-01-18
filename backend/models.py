from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class Technician(BaseModel):
    id: str
    code_name: str
    skills: List[str]
    shift: str
    active_tasks: int = 0


class Task(BaseModel):
    id: str
    task_type: str
    required_skill: str
    priority: str  # Routine | Urgent | Emergency
    status: str = "Pending"
    assigned_to: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    deadline: Optional[datetime] = None
