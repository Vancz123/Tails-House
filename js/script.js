// ==========================================
// OFICINA DO TAILS - SCRIPT DEFINITIVO COM JSON
// ==========================================

let tasks = [];
let currentUser = null;
let currentFilter = 'all';

// 1. Verificação inicial síncrona (Esconde o ecrã de login se já estiver autenticado)
(function checkCriticalAuthEarly() {
    try {
        const user = localStorage.getItem('tails_user_raw');
        if (user && user.trim()) {
            currentUser = user.trim();
            document.documentElement.style.setProperty('--initial-login-display', 'none');
        }
    } catch (e) { }
})();

// 2. Leitura e Gravação com JSON (Tarefas isoladas por Utilizador)
function getTasks() {
    try {
        if (!currentUser) return [];
        // Lê todas as tarefas em JSON
        const allTasks = JSON.parse(localStorage.getItem('tails_tasks_json') || '[]');
        // Retorna APENAS as tarefas pertencentes ao utilizador atual
        return allTasks.filter(t => t.user && t.user.toLowerCase() === currentUser.toLowerCase());
    } catch (e) {
        return [];
    }
}

function saveTasks() {
    try {
        if (!currentUser) return;
        // Lê todas as tarefas existentes
        const allTasks = JSON.parse(localStorage.getItem('tails_tasks_json') || '[]');

        // Mantém as tarefas dos OUTROS utilizadores intactas
        const otherUsersTasks = allTasks.filter(t => !t.user || t.user.toLowerCase() !== currentUser.toLowerCase());

        // Associa o utilizador atual às suas tarefas e junta tudo
        const myTasks = tasks.map(t => ({ ...t, user: currentUser }));
        const combined = [...otherUsersTasks, ...myTasks];

        // Guarda o array completo em formato JSON
        localStorage.setItem('tails_tasks_json', JSON.stringify(combined));
    } catch (e) { }
}

// 3. Controlo de Autenticação
function checkAuth() {
    const loginScreen = document.getElementById('loginScreen');
    const greeting = document.getElementById('userGreetingText');

    try {
        currentUser = localStorage.getItem('tails_user_raw');
    } catch (e) { }

    if (currentUser && currentUser.trim()) {
        if (loginScreen) {
            loginScreen.style.setProperty('display', 'none', 'important');
            loginScreen.classList.add('hidden');
        }
        if (greeting) greeting.textContent = `Olá, ${currentUser}!`;
        tasks = getTasks();
        renderTasks();
    } else {
        if (loginScreen) {
            loginScreen.style.setProperty('display', 'flex', 'important');
            loginScreen.classList.remove('hidden');
        }
    }
}

window.fazerLogin = function () {
    const input = document.getElementById('usernameInput');
    const name = input ? input.value.trim() : '';
    if (!name) {
        alert("Por favor, introduz o teu nome para entrar!");
        return;
    }
    try {
        localStorage.setItem('tails_user_raw', name);
        currentUser = name;
    } catch (e) { }
    checkAuth();
};

// 4. Operações de Tarefas (CRUD)
window.toggleTask = function (id) {
    tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    saveTasks();
    renderTasks();
};

window.deleteTask = function (id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
};

window.openEditModal = function (id) {
    const t = tasks.find(item => item.id === id);
    const modal = document.getElementById('editModal');
    if (!t || !modal) return;

    const editId = document.getElementById('editTaskId');
    const editTitle = document.getElementById('editTaskTitle');
    const editCat = document.getElementById('editTaskCategory');
    const editPri = document.getElementById('editTaskPriority');

    if (editId) editId.value = t.id;
    if (editTitle) editTitle.value = t.title;
    if (editCat) editCat.value = t.category;
    if (editPri) editPri.value = t.priority;

    modal.classList.remove('hidden');
    modal.style.display = 'flex';
};

// 5. Renderização no DOM
function renderTasks() {
    const taskList = document.getElementById('taskList');
    const emptyState = document.getElementById('emptyState');
    const countAll = document.getElementById('countAll');
    const countActive = document.getElementById('countActive');
    const countCompleted = document.getElementById('countCompleted');

    if (countAll) countAll.textContent = tasks.length;
    if (countActive) countActive.textContent = tasks.filter(t => !t.completed).length;
    if (countCompleted) countCompleted.textContent = tasks.filter(t => t.completed).length;

    const filtered = tasks.filter(t => {
        if (currentFilter === 'active') return !t.completed;
        if (currentFilter === 'completed') return t.completed;
        return true;
    });

    if (!taskList) return;
    taskList.innerHTML = '';

    if (emptyState) {
        emptyState.classList.toggle('hidden', filtered.length > 0);
    }

    filtered.forEach(t => {
        const li = document.createElement('li');
        li.className = `task-item priority-${t.priority} ${t.completed ? 'completed' : ''}`;
        li.innerHTML = `
      <div class="task-content">
        <input type="checkbox" class="checkbox-custom" ${t.completed ? 'checked' : ''} onchange="toggleTask('${t.id}')">
        <div class="task-details">
          <span class="task-title">${escapeHTML(t.title)}</span>
          <span class="task-badge"><i class="fa-solid fa-tag"></i> ${t.category}</span>
        </div>
      </div>
      <div class="task-actions">
        <button class="btn btn-sm btn-outline" onclick="openEditModal('${t.id}')" title="Editar"><i class="fa-solid fa-pen"></i></button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteTask('${t.id}')" title="Remover"><i class="fa-solid fa-trash"></i></button>
      </div>
    `;
        taskList.appendChild(li);
    });
}

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}

// 6. API Clima (Open-Meteo)
async function fetchWeather() {
    const box = document.getElementById('apiContent');
    if (!box) return;
    try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=38.7167&longitude=-9.1333&current_weather=true');
        const data = await res.json();
        if (data && data.current_weather) {
            box.innerHTML = `<div><strong>Clima:</strong> ${data.current_weather.temperature}°C</div><div><strong>Vento:</strong> ${data.current_weather.windspeed} km/h</div>`;
        }
    } catch (e) {
        box.innerHTML = `<div><i class="fa-solid fa-triangle-exclamation"></i> Radar Offline</div>`;
    }
}

// 7. Eventos ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    fetchWeather();

    // Gestão de Tema (Claro / Escuro)
    try {
        const savedTheme = localStorage.getItem('tails_theme_raw') || 'dark';
        document.documentElement.classList.toggle('light', savedTheme === 'light');
        const themeBtn = document.getElementById('themeToggleBtn');
        if (themeBtn) {
            themeBtn.innerHTML = `<i class="fa-solid fa-${savedTheme === 'light' ? 'sun' : 'moon'}"></i>`;
        }
    } catch (e) { }

    document.getElementById('themeToggleBtn')?.addEventListener('click', () => {
        const isLight = document.documentElement.classList.toggle('light');
        try {
            localStorage.setItem('tails_theme_raw', isLight ? 'light' : 'dark');
        } catch (e) { }
        const btn = document.getElementById('themeToggleBtn');
        if (btn) btn.innerHTML = `<i class="fa-solid fa-${isLight ? 'sun' : 'moon'}"></i>`;
    });

    // Eventos do Login e Logout
    document.getElementById('loginBtn')?.addEventListener('click', window.fazerLogin);
    document.getElementById('usernameInput')?.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            window.fazerLogin();
        }
    });

    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        try {
            localStorage.removeItem('tails_user_raw');
        } catch (e) { }
        currentUser = null;
        const input = document.getElementById('usernameInput');
        if (input) input.value = '';
        checkAuth();
    });

    // Criar Nova Tarefa
    document.getElementById('taskForm')?.addEventListener('submit', e => {
        e.preventDefault();
        const titleInput = document.getElementById('taskTitle');
        const catInput = document.getElementById('taskCategory');
        const priInput = document.getElementById('taskPriority');

        const title = titleInput ? titleInput.value.trim() : '';
        if (!title) return;

        try {
            currentUser = localStorage.getItem('tails_user_raw') || currentUser;
        } catch (e) { }

        tasks.unshift({
            id: Date.now().toString(),
            title,
            category: catInput ? catInput.value : 'Geral',
            priority: priInput ? priInput.value : 'media',
            completed: false,
            user: currentUser ? currentUser.trim() : 'Geral'
        });

        saveTasks();
        renderTasks();
        if (titleInput) titleInput.value = '';
    });

    // Guardar Edição de Tarefa
    document.getElementById('editForm')?.addEventListener('submit', e => {
        e.preventDefault();
        const editId = document.getElementById('editTaskId');
        const editTitle = document.getElementById('editTaskTitle');
        const editCat = document.getElementById('editTaskCategory');
        const editPri = document.getElementById('editTaskPriority');
        const modal = document.getElementById('editModal');

        if (!editId) return;
        const id = editId.value;

        tasks = tasks.map(t => t.id === id ? {
            ...t,
            title: editTitle ? editTitle.value.trim() : t.title,
            category: editCat ? editCat.value : t.category,
            priority: editPri ? editPri.value : t.priority
        } : t);

        saveTasks();
        renderTasks();
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
    });

    // Cancelar Edição
    document.getElementById('closeModalBtn')?.addEventListener('click', () => {
        const modal = document.getElementById('editModal');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
    });

    // Filtros (Todas, Ativas, Concluídas)
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            const target = e.currentTarget;
            target.classList.add('active');
            currentFilter = target.dataset.filter || 'all';
            renderTasks();
        });
    });

    // Limpar Concluídas
    document.getElementById('clearCompletedBtn')?.addEventListener('click', () => {
        tasks = tasks.filter(t => !t.completed);
        saveTasks();
        renderTasks();
    });

    // Atualização da Hora em Tempo Real
    setInterval(() => {
        const clock = document.getElementById('datetime');
        if (clock) {
            clock.textContent = new Date().toLocaleString('pt-PT', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            });
        }
    }, 1000);
});