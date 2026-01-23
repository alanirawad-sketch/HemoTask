import json
from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import both Create and Full models
from models import Task, TaskCreate, Technician, TechnicianCreate

app = FastAPI(title="HemoTask API")

# -------------------- DATA FILES --------------------

DATA_DIR = Path("backend/data")
DATA_DIR.mkdir(parents=True, exist_ok=True)

TASK_FILE = DATA_DIR / "tasks.json"
TECH_FILE = DATA_DIR / "technicians.json"

# Ensure files exist
if not TASK_FILE.exists():
    TASK_FILE.write_text("[]")

if not TECH_FILE.exists():
    TECH_FILE.write_text("[]")

# -------------------- JSON HELPERS --------------------


def load_json(file_path: Path):
    with open(file_path, "r") as f:
        return json.load(f)


def save_json(file_path: Path, data):
    with open(file_path, "w") as f:
        json.dump(data, f, indent=2)

# -------------------- CORS --------------------


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # OK for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------- TASKS --------------------


@app.get("/tasks")
def get_tasks():
    return load_json(TASK_FILE)


@app.post("/tasks")
def create_task(task: TaskCreate):  # Use TaskCreate (no ID required)
    tasks = load_json(TASK_FILE)

    new_task = {
        "id": str(uuid4()),
        "task_type": task.task_type,
        "required_skill": task.required_skill,
        "priority": task.priority,
        "status": "pending",
        "assigned_to": task.assigned_to
    }

    tasks.append(new_task)
    save_json(TASK_FILE, tasks)

    return new_task

# -------------------- TECHNICIANS --------------------


@app.get("/technicians")
def get_technicians():
    return load_json(TECH_FILE)


@app.post("/technicians")
# Use TechnicianCreate (no ID required)
def create_technician(technician: TechnicianCreate):
    technicians = load_json(TECH_FILE)

    new_tech = {
        "id": str(uuid4()),
        "code_name": technician.code_name,
        "skills": technician.skills,
        "active_tasks": 0
    }

    technicians.append(new_tech)
    save_json(TECH_FILE, technicians)

    return new_tech
