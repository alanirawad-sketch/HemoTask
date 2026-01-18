use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct TaskInput {
    pub required_skill: String,
    pub priority: String,
}

#[derive(Deserialize)]
pub struct TechnicianInput {
    pub id: String,
    pub skills: Vec<String>,
    pub active_tasks: u32,
}

#[derive(Deserialize)]
pub struct AssignmentInput {
    pub task: TaskInput,
    pub technicians: Vec<TechnicianInput>,
}

#[derive(Serialize)]
pub struct AssignmentOutput {
    pub assigned_to: Option<String>,
    pub error: Option<String>,
}

pub fn assign_task(input: AssignmentInput) -> AssignmentOutput {
    if input.technicians.is_empty() {
        return AssignmentOutput {
            assigned_to: None,
            error: Some("No eligible technician".to_string()),
        };
    }

    let mut sorted = input.technicians;

    // Emergency tasks are still load-balanced,
    // but never delayed or rejected here
    sorted.sort_by_key(|t| t.active_tasks);

    AssignmentOutput {
        assigned_to: Some(sorted[0].id.clone()),
        error: None,
    }
}
