let currentTechnicianId = null;
const API_BASE = "http://127.0.0.1:8000";

/* -------------------- UTIL -------------------- */

async function apiFetch(url, options = {}) {
    const res = await fetch(url, options);
    if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "API error");
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
    const container = document.getElementById("technician-list");
    container.innerHTML = "";

    technicians.forEach(t => {
        const div = document.createElement("div");
        div.className = "card";

        if (t.active_tasks >= 3) {
            div.classList.add("overloaded");
        }

        div.innerHTML = `
            <strong>${t.code_name}</strong><br>
            Skills: ${t.skills.join(", ")}<br>
            Active tasks: ${t.active_tasks}
        `;

        // Supervisor-only shift control
        if (!currentTechnicianId) {
            const shiftBtn = document.createElement("button");
            shiftBtn.textContent = "End Shift";
            shiftBtn.onclick = async () => {
                await apiFetch(
                    `${API_BASE}/technicians/${t.id}/shift?new_shift=Off`,
                    { method: "POST" }
                );
                refreshUI();
            };
            div.appendChild(shiftBtn);
        }

        container.appendChild(div);
    });
}

/* ---------------- TASKS ---------------- */

async function loadTasks() {
    const tasks = await apiFetch(`${API_BASE}/tasks`);

    const visibleTasks = currentTechnicianId
        ? tasks.filter(t => t.assigned_to === currentTechnicianId)
        : tasks;

    const container = document.getElementById("task-list");
    container.innerHTML = "";

    visibleTasks.forEach(task => {
        const div = document.createElement("div");
        div.className = `card priority-${task.priority}`;

        div.innerHTML = `
            <strong>${task.task_type}</strong><br>
            Skill: ${task.required_skill}<br>
            Status: ${task.status}<br>
            Assigned to: ${task.assigned_to ?? "—"}<br>
        `;

        // Supervisor: assign
        if (!currentTechnicianId && task.status === "Pending") {
            const btn = document.createElement("button");
            btn.textContent = "Assign";
            btn.onclick = () => assignTask(task.id);
            div.appendChild(btn);
        }

        // Technician: start
        if (task.status === "Assigned" && task.assigned_to === currentTechnicianId) {
            const startBtn = document.createElement("button");
            startBtn.textContent = "Start";
            startBtn.onclick = () => startTask(task.id);
            div.appendChild(startBtn);
        }

        // Technician: complete
        if (task.status === "In Progress" && task.assigned_to === currentTechnicianId) {
            const completeBtn = document.createElement("button");
            completeBtn.textContent = "Complete";
            completeBtn.onclick = () => completeTask(task.id);
            div.appendChild(completeBtn);
        }

        container.appendChild(div);
    });
}

/* ---------------- ACTIONS ---------------- */

async function assignTask(taskId) {
    await apiFetch(`${API_BASE}/assign-task/${taskId}`, { method: "POST" });
    refreshUI();
}

async function startTask(taskId) {
    await apiFetch(
        `${API_BASE}/tasks/${taskId}/start?technician_id=${currentTechnicianId}`,
        { method: "POST" }
    );
    refreshUI();
}

async function completeTask(taskId) {
    await apiFetch(
        `${API_BASE}/tasks/${taskId}/complete?technician_id=${currentTechnicianId}`,
        { method: "POST" }
    );
    refreshUI();
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

/* ---------------- TECH SELECT ---------------- */

async function loadTechnicianSelector() {
    const technicians = await apiFetch(`${API_BASE}/technicians`);
    const select = document.getElementById("tech-select");

    select.innerHTML = `<option value="">Supervisor View</option>`;

    technicians.forEach(t => {
        const opt = document.createElement("option");
        opt.value = t.id;
        opt.textContent = t.code_name;
        select.appendChild(opt);
    });

    select.onchange = e => {
        currentTechnicianId = e.target.value || null;
        refreshUI();
    };
}

/* ---------------- INIT ---------------- */

loadTechnicianSelector();
refreshUI();

setInterval(refreshUI, 10000);

// Store technicians in memory
let technicians = [];

// Called when button is clicked
function addTechnician() {
    const input = document.getElementById("technician-name-input");
    const name = input.value.trim();

    if (name === "") return;

    technicians.push(name);
    input.value = "";

    renderTechnicians();
}

// Update the Technicians section
function renderTechnicians() {
    const container = document.getElementById("technician-list");
    container.innerHTML = "";

    technicians.forEach(tech => {
        const div = document.createElement("div");
        div.className = "technician-item";
        div.textContent = tech;
        container.appendChild(div);
    });
}

/* ==============================
   Data Storage
============================== */
let technicians = [];
let tasks = [];

/* ==============================
   Add Technician
============================== */
function addTechnician() {
    const input = document.getElementById("technicianName");
    const name = input.value.trim();

    if (name === "") return;

    technicians.push(name);
    input.value = "";

    renderTechnicians();
}

/* ==============================
   Render Technicians
============================== */
function renderTechnicians() {
    const list = document.getElementById("techniciansList");
    list.innerHTML = "";

    technicians.forEach((tech) => {
        const li = document.createElement("li");
        li.textContent = tech;
        list.appendChild(li);
    });
}

/* ==============================
   Add Task
============================== */
function addTask() {
    const input = document.getElementById("taskTitle");
    const title = input.value.trim();

    if (title === "") return;

    tasks.push(title);
    input.value = "";

    renderTasks();
}

/* ==============================
   Render Tasks
============================== */
function renderTasks() {
    const list = document.getElementById("tasksList");
    list.innerHTML = "";

    tasks.forEach((task) => {
        const li = document.createElement("li");
        li.textContent = task;
        list.appendChild(li);
    });
}
