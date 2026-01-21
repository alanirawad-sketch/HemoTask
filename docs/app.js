const API_BASE = "http://127.0.0.1:8000";

/* -------------------- UTIL -------------------- */

async function apiFetch(url, options = {}) {
    const res = await fetch(url, options);
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
    }
    return res.json();
}

function refreshUI() {
    loadTechnicians();
    loadTasks();
}

/* ---------------- TECHNICIANS ---------------- */

async function loadTechnicians() {
    const technicians = await apiFetch(`${API_BASE}/technicians`);
    const list = document.getElementById("techniciansList");
    list.innerHTML = "";

    technicians.forEach(t => {
        const li = document.createElement("li");
        li.className = "card";

        if (t.active_tasks >= 3) {
            li.classList.add("overloaded");
        }

        li.innerHTML = `
            <strong>${t.code_name}</strong><br>
            <small>Skills: ${t.skills.join(", ")}</small><br>
            <small>Active tasks: ${t.active_tasks}</small>
        `;

        list.appendChild(li);
    });
}

/* ---------------- ADD TECHNICIAN ---------------- */

document
    .getElementById("technician-form")
    .addEventListener("submit", async e => {
        e.preventDefault();

        const technician = {
            code_name: document.getElementById("tech-name").value.trim(),
            skills: document
                .getElementById("tech-skills")
                .value
                .split(",")
                .map(s => s.trim())
        };

        await apiFetch(`${API_BASE}/technicians`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(technician)
        });

        e.target.reset();
        refreshUI();
    });

/* ---------------- TASKS ---------------- */

async function loadTasks() {
    const tasks = await apiFetch(`${API_BASE}/tasks`);
    const list = document.getElementById("tasksList");
    list.innerHTML = "";

    tasks.forEach(task => {
        const li = document.createElement("li");
        li.className = `card priority-${task.priority.toLowerCase()}`;

        li.innerHTML = `
            <strong>${task.task_type}</strong><br>
            <small>Required skill: ${task.required_skill}</small><br>
            <small>Status: ${task.status}</small><br>
            <small>Assigned to: ${task.assigned_to ?? "—"}</small>
        `;

        list.appendChild(li);
    });
}

/* ---------------- CREATE TASK ---------------- */

document
    .getElementById("task-form")
    .addEventListener("submit", async e => {
        e.preventDefault();

        const task = {
            task_type: document.getElementById("task-type").value.trim(),
            required_skill: document.getElementById("required-skill").value,
            priority: document.getElementById("priority").value
        };

        await apiFetch(`${API_BASE}/tasks`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(task)
        });

        e.target.reset();
        refreshUI();
    });

/* ---------------- INIT ---------------- */

refreshUI();
setInterval(refreshUI, 10000);
