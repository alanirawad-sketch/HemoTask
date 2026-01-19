const API_BASE = "http://127.0.0.1:8000";

/* -------------------- UTIL -------------------- */

async function apiFetch(url, options = {}) {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

function refreshUI() {
    loadTechnicians();
    loadTasks();
}

/* ---------------- TECHNICIANS ---------------- */

async function loadTechnicians() {
    const technicians = await apiFetch(`${API_BASE}/technicians`);
    const container = document.getElementById("technician-list");
    container.innerHTML = "";

    technicians.forEach(t => {
        const card = document.createElement("div");
        card.className = "card";

        if (t.active_tasks >= 3) card.classList.add("overloaded");

        card.innerHTML = `
            <strong>${t.code_name}</strong><br>
            Skills: ${t.skills.join(", ")}<br>
            Active tasks: ${t.active_tasks}
        `;

        container.appendChild(card);
    });
}

/* ---------------- ADD TECHNICIAN ---------------- */

document.getElementById("technician-form").addEventListener("submit", async e => {
    e.preventDefault();

    const technician = {
        code_name: document.getElementById("tech-name").value,
        skills: document.getElementById("tech-skills").value
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
    const container = document.getElementById("task-list");
    container.innerHTML = "";

    tasks.forEach(task => {
        const card = document.createElement("div");
        card.className = `card priority-${task.priority}`;

        card.innerHTML = `
            <strong>${task.task_type}</strong><br>
            Required skill: ${task.required_skill}<br>
            Status: ${task.status}<br>
            Assigned to: ${task.assigned_to ?? "—"}
        `;

        container.appendChild(card);
    });
}

/* ---------------- CREATE TASK ---------------- */

document.getElementById("task-form").addEventListener("submit", async e => {
    e.preventDefault();

    const task = {
        task_type: document.getElementById("task-type").value,
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
