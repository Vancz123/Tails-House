// ==========================================
// 1. GESTÃO DE DADOS
// ==========================================

function getTasksFromStorage() {
    const rawData = localStorage.getItem('tails_tasks_raw');
    if (!rawData || rawData.trim() === '') return [];

    const taskStrings = rawData.split('|||');
    return taskStrings.map(str => {
        const parts = str.split(':::');
        return {
            id: parts[0],
            title: parts[1],
            category: parts[2],
            priority: parts[3],
            completed: parts[4] === 'true'
        };
    });
}

function saveTasksToStorage(tasksArray) {
    const taskStrings = tasksArray.map(t =>
        `${t.id}:::${t.title.replace(/:::/g, '').replace(/\|\|\|/g, '')}:::${t.category}:::${t.priority}:::${t.completed}`
    );
    const rawData = taskStrings.join('|||');
    localStorage.setItem('tails_tasks_raw', rawData);
}

// ESTADO GLOBAL
let tasks = getTasksFromStorage();
let currentUser = localStorage.getItem('tails_user_raw') || null;
let currentFilter = 'all';

// ==========================================
// 2. REFERÊNCIAS DO DOM
// ==========================================
const loginScreen = document.getElementById('loginScreen');
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('usernameInput');
const userGreetingText = document.getElementById('userGreetingText');
const logoutBtn = document.getElementById('logoutBtn');

const themeToggleBtn = document.getElementById('themeToggleBtn');
const datetimeDisplay = document.getElementById('datetime');

const taskForm = document.getElementById('taskForm');
const taskTitle = document.getElementById('taskTitle');
const taskCategory = document.getElementById('taskCategory');
const taskPriority = document.getElementById('taskPriority');
const taskList = document.getElementById('taskList');
const emptyState = document.getElementById('emptyState');

const filterBtns = document.querySelectorAll('.filter-btn');
const countAll = document.getElementById('countAll');
const countActive = document.getElementById('countActive');
const countCompleted = document.getElementById('countCompleted');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');

const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const editTaskId = document.getElementById('editTaskId');
const editTaskTitle = document.getElementById('editTaskTitle');
const editTaskCategory = document.getElementById('editTaskCategory');
const editTaskPriority = document.getElementById('editTaskPriority');
const closeModalBtn = document.getElementById('closeModalBtn');

const apiContent = document.getElementById('apiContent');

// ==========================================
// 3. INICIALIZAÇÃO DA APLICAÇÃO
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    checkAuth();
    updateClock();
    setInterval(updateClock, 1000);
    fetchExternalAPI();
    renderTasks();
});

// ==========================================
// 4. MODO CLARO / ESCURO (LOCAL STORAGE)
// ==========================================
function initTheme() {
    const savedTheme = localStorage.getItem('tails_theme_raw') || 'dark';
    if (savedTheme === 'light') {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
        themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
    } else {
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
        themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
    }
}

themeToggleBtn.addEventListener('click', () => {
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
        localStorage.setItem('tails_theme_raw', 'light');
        themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
    } else {
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
        localStorage.setItem('tails_theme_raw', 'dark');
        themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
    }
});

// ==========================================
// 5. AUTENTICAÇÃO E SESSÃO
// ==========================================
function checkAuth() {
    if (currentUser && currentUser !== '') {
        loginScreen.classList.add('hidden');
        userGreetingText.textContent = `Olá, ${currentUser}!`;
    } else {
        loginScreen.classList.remove('hidden');
    }
}

loginForm.addEventListener('submit', (e) => {
    e.preventDefault(); // Impede a página de dar refresh!

    const username = usernameInput.value.trim();
    if (username !== '') {
        currentUser = username;
        // Guardar a string diretamente no LocalStorage
        localStorage.setItem('tails_user_raw', currentUser);

        // Esconder a tela de login e atualizar a saudação
        checkAuth();
    }
});

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('tails_user_raw');
    currentUser = null;
    usernameInput.value = '';
    checkAuth();
});

// ==========================================
// 6. HORA E DATA EM TEMPO REAL
// ==========================================
function updateClock() {
    const now = new Date();
    datetimeDisplay.textContent = now.toLocaleString('pt-PT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// ==========================================
// 7. INTEGRAÇÃO DE API EXTERNA
// ==========================================
async function fetchExternalAPI() {
    try {
        const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=38.7167&longitude=-9.1333&current_weather=true');
        const data = await response.json();

        if (data.current_weather) {
            const temp = data.current_weather.temperature;
            const wind = data.current_weather.windspeed;
            apiContent.innerHTML = `
        <div><strong>Clima na Oficina:</strong> ${temp}°C</div>
        <div><strong>Vento p/ Voar (Tornado):</strong> ${wind} km/h</div>
      `;
        }
    } catch (error) {
        apiContent.innerHTML = `<div><i class="fa-solid fa-triangle-exclamation"></i> Sinal de Radar Offline</div>`;
    }
}

// ==========================================
// 8. LÓGICA DE TAREFAS (CRUD)
// ==========================================
function saveAndRender() {
    saveTasksToStorage(tasks);
    renderTasks();
}

taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newTitle = taskTitle.value.trim();
    if (!newTitle) return;

    const newTask = {
        id: Date.now().toString(),
        title: newTitle,
        category: taskCategory.value,
        priority: taskPriority.value,
        completed: false
    };

    tasks.unshift(newTask);
    saveAndRender();
    taskTitle.value = '';
});

window.toggleTask = function (id) {
    tasks = tasks.map(task => {
        if (task.id === id) {
            return { ...task, completed: !task.completed };
        }
        return task;
    });
    saveAndRender();
};

window.deleteTask = function (id) {
    tasks = tasks.filter(task => task.id !== id);
    saveAndRender();
};

window.openEditModal = function (id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    editTaskId.value = task.id;
    editTaskTitle.value = task.title;
    editTaskCategory.value = task.category;
    editTaskPriority.value = task.priority;

    editModal.classList.remove('hidden');
};

closeModalBtn.addEventListener('click', () => {
    editModal.classList.add('hidden');
});

editForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = editTaskId.value;

    tasks = tasks.map(t => {
        if (t.id === id) {
            return {
                ...t,
                title: editTaskTitle.value.trim(),
                category: editTaskCategory.value,
                priority: editTaskPriority.value
            };
        }
        return t;
    });

    editModal.classList.add('hidden');
    saveAndRender();
});

// ==========================================
// 9. FILTROS E LIMPEZA DE CONCLUÍDAS
// ==========================================
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderTasks();
    });
});

clearCompletedBtn.addEventListener('click', () => {
    tasks = tasks.filter(t => !t.completed);
    saveAndRender();
});

// ==========================================
// 10. RENDERIZAÇÃO DA INTERFACE
// ==========================================
function renderTasks() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const active = total - completed;

    countAll.textContent = total;
    countActive.textContent = active;
    countCompleted.textContent = completed;

    let filteredTasks = tasks;
    if (currentFilter === 'active') {
        filteredTasks = tasks.filter(t => !t.completed);
    } else if (currentFilter === 'completed') {
        filteredTasks = tasks.filter(t => t.completed);
    }

    taskList.innerHTML = '';

    if (filteredTasks.length === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');

        filteredTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item priority-${task.priority} ${task.completed ? 'completed' : ''}`;

            li.innerHTML = `
        <div class="task-content">
          <input type="checkbox" class="checkbox-custom" ${task.completed ? 'checked' : ''} onchange="toggleTask('${task.id}')">
          <div class="task-details">
            <span class="task-title">${escapeHTML(task.title)}</span>
            <span class="task-badge"><i class="fa-solid fa-tag"></i> ${task.category}</span>
          </div>
        </div>
        <div class="task-actions">
          <button class="btn btn-sm btn-outline" onclick="openEditModal('${task.id}')" title="Editar">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteTask('${task.id}')" title="Remover">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      `;
            taskList.appendChild(li);
        });
    }
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g,
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}