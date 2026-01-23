import subprocess
import json
from models import Technician, Task
from datetime import datetime
from pathlib import Path
import json
from fastapi import APIRouter, HTTPException
from uuid import uuid4

router = APIRouter()


DATA_DIR = Path("backend/data")
TECH_FILE = DATA_DIR / "technicians.json"
TASK_FILE = DATA_DIR / "tasks.json"
AUDIT_FILE = DATA_DIR / "audit.log"


def load_technicians():
    with open(TECH_FILE, "r") as f:
        return json.load(f)


def save_technicians(data):
    with open(TECH_FILE, "w") as f:
        json.dump(data, f, indent=2)


def load_tasks():
    with open(TASK_FILE, "r") as f:
        return json.load(f)


def save_tasks(data):
    with open(TASK_FILE, "w") as f:
        json.dump(data, f, indent=2)


def write_audit(entity_id, action, performed_by="SYSTEM"):
    timestamp = datetime.utcnow().isoformat()
    line = f"{timestamp} | {entity_id} | {action} | {performed_by}\n"
    with open(AUDIT_FILE, "a") as f:
        f.write(line)


@router.post("/technicians")
def add_technician(tech: Technician):
    technicians = load_technicians()

    if any(t["id"] == tech.id for t in technicians):
        raise HTTPException(
            status_code=400, detail="Technician already exists")

    technicians.append(tech.dict())
    save_technicians(technicians)

    write_audit(tech.id, "TECHNICIAN_CREATED")
    return tech


@router.get("/technicians")
def get_technicians():
    return load_technicians()


@router.post("/tasks")
def create_task(task: Task):
    tasks = load_tasks()

    task.id = f"TASK_{uuid4().hex[:6]}"
    tasks.append(task.dict())

    save_tasks(tasks)
    write_audit(task.id, "TASK_CREATED")

    return task


@router.get("/tasks")
def get_tasks():
    return load_tasks()


def is_on_shift(technician):
    return technician.get("shift") != "Off"


def has_skill(technician, skill):
    return skill in technician.get("skills", [])


def can_accept_task(technician, max_tasks=3):
    return technician.get("active_tasks", 0) < max_tasks


def find_eligible_technicians(task, technicians):
    eligible = []

    for tech in technicians:
        if not is_on_shift(tech):
            continue
        if not has_skill(tech, task["required_skill"]):
            continue
        if not can_accept_task(tech):
            continue

        eligible.append(tech)

    return eligible


def select_best_technician(technicians):
    return sorted(
        technicians,
        key=lambda t: t.get("active_tasks", 0)
    )[0]


@router.post("/assign-task/{task_id}")
def assign_task(task_id: str):
    tasks = load_tasks()
    technicians = load_technicians()

    task = next((t for t in tasks if t["id"] == task_id), None)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task["status"] != "Pending":
        raise HTTPException(status_code=400, detail="Task is not assignable")

    eligible = find_eligible_technicians(task, technicians)
    if not eligible:
        raise HTTPException(
            status_code=400, detail="No eligible technicians available")
    if task["priority"] == "Emergency":
        eligible = sorted(
            eligible,
            key=lambda t: t.get("active_tasks", 0)
        )

    selected_id = call_rust_engine(task, eligible)
    selected = next(t for t in technicians if t["id"] == selected_id)

    # Assign task
    task["assigned_to"] = selected["id"]
    task["status"] = "Assigned"
    selected["active_tasks"] += 1

    save_tasks(tasks)
    save_technicians(technicians)

    write_audit(task_id, "TASK_ASSIGNED", selected["id"])

    return {
        "task_id": task_id,
        "assigned_to": selected["id"]
    }


@router.post("/tasks/{task_id}/start")
def start_task(task_id: str, technician_id: str):
    tasks = load_tasks()

    task = next((t for t in tasks if t["id"] == task_id), None)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task["status"] != "Assigned":
        raise HTTPException(status_code=400, detail="Task cannot be started")

    if task["assigned_to"] != technician_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    task["status"] = "In Progress"
    task["started_at"] = datetime.utcnow().isoformat()

    save_tasks(tasks)
    write_audit(task_id, "TASK_STARTED", technician_id)

    return {"message": "Task started"}


@router.post("/tasks/{task_id}/complete")
def complete_task(task_id: str, technician_id: str):
    tasks = load_tasks()
    technicians = load_technicians()

    task = next((t for t in tasks if t["id"] == task_id), None)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task["status"] != "In Progress":
        raise HTTPException(status_code=400, detail="Task not in progress")

    if task["assigned_to"] != technician_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    tech = next(t for t in technicians if t["id"] == technician_id)

    task["status"] = "Completed"
    now = datetime.utcnow()
    task["completed_at"] = now.isoformat()

# calculate duration
    if task.get("started_at"):
        start = datetime.fromisoformat(task["started_at"])
    task["duration_seconds"] = int((now - start).total_seconds())

    tech["active_tasks"] -= 1

    save_tasks(tasks)
    save_technicians(technicians)

    write_audit(task_id, "TASK_COMPLETED", technician_id)

    return {"message": "Task completed"}


def call_rust_engine(task, technicians):
    payload = {
        "task": {
            "required_skill": task["required_skill"],
            "priority": task["priority"]
        },
        "technicians": [
            {
                "id": t["id"],
                "skills": t["skills"],
                "active_tasks": t["active_tasks"]
            }
            for t in technicians
        ]
    }

    process = subprocess.run(
        ["../rust_engine/target/release/hemotask_engine"],
        input=json.dumps(payload),
        text=True,
        capture_output=True
    )

    result = json.loads(process.stdout)

    if result.get("error"):
        raise HTTPException(status_code=400, detail=result["error"])

    return result["assigned_to"]


@router.post("/technicians/{tech_id}/shift")
def update_shift(tech_id: str, new_shift: str):
    technicians = load_technicians()

    tech = next((t for t in technicians if t["id"] == tech_id), None)
    if not tech:
        raise HTTPException(status_code=404, detail="Technician not found")

    tech["shift"] = new_shift
    save_technicians(technicians)

    write_audit(tech_id, f"SHIFT_CHANGED_TO_{new_shift}")
    return tech
