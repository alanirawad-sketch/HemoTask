const API_BASE = "http://127.0.0.1:8000";

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
        const list = document.getElementById('techniciansList');
        const count = document.getElementById('techCount');

        if (!technicians || technicians.length === 0) {
            list.innerHTML = '<li class="empty-state">No technicians available</li>';
            count.textContent = '0';
            return;
        }

        list.innerHTML = '';
        count.textContent = technicians.length;

        technicians.forEach(tech => {
            const li = document.createElement('li');
            li.className = 'card';

            if (tech.active_tasks >= 3) {
                li.classList.add('overloaded');
            }

            li.innerHTML = `
                <strong>${tech.code_name}</strong>
                <small>Skills: ${tech.skills.join(', ')}</small>
                <small>Active tasks: ${tech.active_tasks}</small>
            `;

            list.appendChild(li);
        });

        console.log('Technicians loaded successfully');
    } catch (error) {
        console.error('Error loading technicians:', error);
        showNotification('Failed to load technicians: ' + error.message, 'error');
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

            li.innerHTML = `
                <strong>${task.task_type}</strong>
                <small>Required skill: ${task.required_skill}</small>
                <small>Status: <span class="${statusClass}">${task.status.replace('_', ' ')}</span></small>
                <small>Assigned to: ${task.assigned_to || '—'}</small>
            `;

            list.appendChild(li);
        });

        console.log('Tasks loaded successfully');
    } catch (error) {
        console.error('Error loading tasks:', error);
        showNotification('Failed to load tasks: ' + error.message, 'error');
    }
}

/* -------------------- CREATE TASK -------------------- */

document.getElementById('task-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const button = e.target.querySelector('button');
    button.disabled = true;
    showLoading();

    try {
        const taskData = {
            task_type: document.getElementById('task-type').value.trim(),
            required_skill: document.getElementById('required-skill').value,
            priority: document.getElementById('priority').value
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
setInterval(refreshUI, 10000);