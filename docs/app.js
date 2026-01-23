function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function startLiveTimer(el, startedAt) {
    const start = new Date(startedAt);

    function update() {
        const now = new Date();
        const diff = Math.floor((now - start) / 1000);
        el.textContent = formatTime(diff);
    }

    update();
    setInterval(update, 1000);
}

async function startTask(id, techId) {
    await apiFetch(`${API_BASE}/tasks/${id}/start?technician_id=${techId}`, {
        method: "POST"
    });
    loadTasks();
}

async function completeTask(id, techId) {
    await apiFetch(`${API_BASE}/tasks/${id}/complete?technician_id=${techId}`, {
        method: "POST"
    });
    loadTasks();
}


const API_BASE = "http://127.0.0.1:8000";
let techniciansCache = [];


/* -------------------- UTILITIES -------------------- */

async function apiFetch(url, options = {}) {
    try {
        console.log('Fetching:', url, options);
        const res = await fetch(url, options);

        console.log('Response status:', res.status);

        if (!res.ok) {
            const text = await res.text();
            console.error('API Error Response:', text);
            throw new Error(text || `HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        console.log('Response data:', data);
        return data;
    } catch (error) {
        console.error('API Fetch Error:', error);
        throw error;
    }
}

function showLoading() {
    document.getElementById('loadingOverlay').classList.add('active');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('active');
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

/* -------------------- TECHNICIANS -------------------- */
async function loadTechnicians() {
    try {
        console.log('Loading technicians...');

        const technicians = await apiFetch(`${API_BASE}/technicians`);
        techniciansCache = technicians;

        const list = document.getElementById('techniciansList');
        const count = document.getElementById('techCount');
        const select = document.getElementById('task-technician');

        /* ---------- empty state ---------- */
        if (!technicians || technicians.length === 0) {
            list.innerHTML = '<li class="empty-state">No technicians available</li>';
            count.textContent = '0';

            if (select) {
                select.innerHTML = '<option value="">Select technician...</option>';
            }

            return;
        }

        /* ---------- render technicians list ---------- */
        list.innerHTML = '';
        count.textContent = technicians.length;

        technicians.forEach(tech => {
            const li = document.createElement('li');
            li.className = 'card';

            if (tech.active_tasks >= 3) {
                li.classList.add('overloaded');
            }

            li.innerHTML = `
                <div class="card-content">
                    <div>
                        <strong>${tech.code_name}</strong>
                        <small>Skills: ${tech.skills.join(', ')}</small>
                        <small>Active tasks: ${tech.active_tasks}</small>
                    </div>
                    <button class="delete-btn" onclick="deleteTechnician('${tech.code_name}')">
                        🗑️
                    </button>
                </div>
            `;

            list.appendChild(li);
        });

        /* ---------- populate dropdown ---------- */
        if (select) {
            const currentValue = select.value;

            select.innerHTML = '<option value="">Select technician...</option>';

            technicians.forEach(tech => {
                const option = document.createElement('option');
                option.value = tech.code_name;
                option.textContent = tech.code_name;

                if (tech.code_name === currentValue) {
                    option.selected = true;
                }

                select.appendChild(option);
            });
        }

        console.log('Technicians loaded successfully');

    } catch (error) {
        console.error('Error loading technicians:', error);
        showNotification('Failed to load technicians: ' + error.message, 'error');
    }
}


/* -------------------- DELETE TECHNICIAN -------------------- */

async function deleteTechnician(codeName) {
    if (!confirm(`Are you sure you want to delete technician "${codeName}"?`)) {
        return;
    }

    showLoading();

    try {
        console.log('Deleting technician:', codeName);

        const response = await fetch(`${API_BASE}/technicians/${codeName}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`Failed to delete technician: ${response.status}`);
        }

        console.log('Technician deleted successfully');
        await loadTechnicians();
        showNotification('Technician deleted successfully!');
    } catch (error) {
        console.error('Error deleting technician:', error);
        showNotification('Failed to delete technician: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

/* -------------------- ADD TECHNICIAN -------------------- */

document.getElementById('technician-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const button = e.target.querySelector('button');
    button.disabled = true;
    showLoading();

    try {
        const technicianData = {
            code_name: document.getElementById('tech-name').value.trim(),
            skills: document.getElementById('tech-skills').value
                .split(',')
                .map(s => s.trim())
                .filter(s => s)
        };

        console.log('Sending technician data:', technicianData);

        const result = await apiFetch(`${API_BASE}/technicians`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(technicianData)
        });

        console.log('Technician created:', result);

        e.target.reset();
        await loadTechnicians();
        showNotification('Technician added successfully!');
    } catch (error) {
        console.error('Error adding technician:', error);
        showNotification('Failed to add technician: ' + error.message, 'error');
    } finally {
        hideLoading();
        button.disabled = false;
    }
});

/* -------------------- TASKS -------------------- */

async function loadTasks() {
    try {
        console.log('Loading tasks...');
        const tasks = await apiFetch(`${API_BASE}/tasks`);
        const list = document.getElementById('tasksList');
        const count = document.getElementById('taskCount');

        if (!tasks || tasks.length === 0) {
            list.innerHTML = '<li class="empty-state">No tasks available</li>';
            count.textContent = '0';
            return;
        }

        list.innerHTML = '';
        count.textContent = tasks.length;

        tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `card priority-${task.priority.toLowerCase()}`;

            const statusClass = `status-${task.status.toLowerCase()}`;

            let timerHTML = '';
            let actionButtons = '';

            if (task.status === "In Progress" && task.started_at) {
                timerHTML = `<small>⏱ Time: <span id="timer-${task.id}">00:00</span></small>`;
                actionButtons = `
            <button onclick="completeTask('${task.id}', '${task.assigned_to}')">
                ✅ Complete
            </button>
        `;
            }
            else if (task.status === "Assigned") {
                actionButtons = `
            <button onclick="startTask('${task.id}', '${task.assigned_to}')">
                ▶ Start
            </button>
        `;
            }
            else if (task.status === "Completed") {
                timerHTML = `<small>✔ Duration: ${formatTime(task.duration_seconds || 0)}</small>`;
            }

            li.innerHTML = `
        <div class="card-content">
            <div>
                <strong>${task.task_type}</strong>
                <small>Required skill: ${task.required_skill}</small>
                <small>Status: <span class="${statusClass}">${task.status}</span></small>
                <small>Assigned to: ${task.assigned_to || '—'}</small>
                ${timerHTML}
            </div>
            ${actionButtons}
        </div>
    `;

            list.appendChild(li);

            if (task.status === "In Progress" && task.started_at) {
                startLiveTimer(
                    document.getElementById(`timer-${task.id}`),
                    task.started_at
                );
            }
        });


        console.log('Tasks loaded successfully');
    } catch (error) {
        console.error('Error loading tasks:', error);
        showNotification('Failed to load tasks: ' + error.message, 'error');
    }
}

/* -------------------- DELETE TASK -------------------- */

async function deleteTask(taskId) {
    if (!confirm(`Are you sure you want to delete this task?`)) {
        return;
    }

    showLoading();

    try {
        console.log('Deleting task:', taskId);

        const response = await fetch(`${API_BASE}/tasks/${taskId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`Failed to delete task: ${response.status}`);
        }

        console.log('Task deleted successfully');
        await loadTasks();
        showNotification('Task deleted successfully!');
    } catch (error) {
        console.error('Error deleting task:', error);
        showNotification('Failed to delete task: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

/* -------------------- CREATE TASK -------------------- */

document.getElementById('task-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const button = e.target.querySelector('button');
    button.disabled = true;
    showLoading();

    try {
        const assignedTo = document.getElementById('task-technician').value;

        if (!assignedTo) {
            showNotification('Please select a technician first', 'error');
            return;
        }

        const taskData = {
            task_type: document.getElementById('task-type').value.trim(),
            required_skill: document.getElementById('required-skill').value,
            priority: document.getElementById('priority').value,
            assigned_to: assignedTo
        };

        console.log('Sending task data:', taskData);

        const result = await apiFetch(`${API_BASE}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskData)
        });

        console.log('Task created:', result);

        e.target.reset();
        await loadTasks();
        showNotification('Task created successfully!');
    } catch (error) {
        console.error('Error creating task:', error);
        showNotification('Failed to create task: ' + error.message, 'error');
    } finally {
        hideLoading();
        button.disabled = false;
    }
});

/* -------------------- INITIALIZATION -------------------- */

async function refreshUI() {
    await Promise.all([
        loadTechnicians(),
        loadTasks()
    ]);
}

// Initial load
document.addEventListener('DOMContentLoaded', () => {
    console.log('🩸 HemoTask Dashboard initializing...');
    refreshUI();
});

// Auto-refresh every 10 seconds
setInterval(loadTasks, 10000);
