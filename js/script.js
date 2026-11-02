// ==========================================
// 1. GESTÃO DE DADOS (SEM USO DE JSON NO LOCALSTORAGE)
// ==========================================
// Formato no localStorage: "id:::titulo:::categoria:::prioridade:::concluida|||id2:::..."

function getTasksFromStorage() {
  let rawData = null;
  try {
    rawData = localStorage.getItem('tails_tasks_raw');
  } catch (err) {
    console.warn("LocalStorage indisponível para leitura:", err);
  }

  if (!rawData || rawData.trim() === '') return [];

  const taskStrings = rawData.split('|||');
  return taskStrings.filter(str => str.trim() !== '').map(str => {
    const parts = str.split(':::');
    return {
      id: parts[0] || Date.now().toString(),
      title: parts[1] || '',
      category: parts[2] || 'Geral',
      priority: parts[3] || 'media',
      completed: parts[4] === 'true'
    };
  });
}

function saveTasksToStorage(tasksArray) {
  const taskStrings = tasksArray.map(t => 
    `${t.id}:::${t.title.replace(/:::/g, '').replace(/\|\|\|/g, '')}:::${t.category}:::${t.priority}:::${t.completed}`
  );
  const rawData = taskStrings.join('|||');
  try {
    localStorage.setItem('tails_tasks_raw', rawData);
  } catch (err) {
    console.warn("Não foi possível guardar tarefas no LocalStorage:", err);
  }
}

// ESTADO GLOBAL DA APLICAÇÃO
let tasks = getTasksFromStorage();
let currentUser = null;
try {
  currentUser = localStorage.getItem('tails_user_raw') || null;
} catch (err) {
  console.warn("LocalStorage indisponível para utilizador:", err);
}
let currentFilter = 'all';

// ==========================================
// 2. REFERÊNCIAS DO DOM
// ==========================================
const loginScreen = document.getElementById('loginScreen');
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
  let savedTheme = 'dark';
  try {
    savedTheme = localStorage.getItem('tails_theme_raw') || 'dark';
  } catch (err) {
    console.warn("LocalStorage indisponível para tema:", err);
  }

  if (savedTheme === 'light') {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    if (themeToggleBtn) themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
  } else {
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
    if (themeToggleBtn) themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
  }
}

if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      try { localStorage.setItem('tails_theme_raw', 'light'); } catch (err) {}
      themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      try { localStorage.setItem('tails_theme_raw', 'dark'); } catch (err) {}
      themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
    }
  });
}

// ==========================================
// 5. AUTENTICAÇÃO E SESSÃO
// ==========================================
function checkAuth() {
  let savedUser = null;
  try {
    savedUser = localStorage.getItem('tails_user_raw');
  } catch (err) {
    console.warn("LocalStorage indisponível:", err);
  }

  currentUser = savedUser || currentUser;

  if (currentUser && currentUser.trim() !== '') {
    if (loginScreen) {
      loginScreen.style.display = 'none';
      loginScreen.classList.add('hidden');
    }
    if (userGreetingText) userGreetingText.textContent = `Olá, ${currentUser}!`;
  } else {
    if (loginScreen) {
      loginScreen.style.display = 'flex';
      loginScreen.classList.remove('hidden');
    }
  }
}

// Função global de login chamada diretamente pelo botão
window.fazerLogin = function() {
  const input = document.getElementById('usernameInput');
  const name = input ? input.value.trim() : '';
  
  if (name !== '') {
    currentUser = name;
    try {
      localStorage.setItem('tails_user_raw', currentUser);
    } catch (err) {
      console.warn("Não foi possível guardar utilizador:", err);
    }
    checkAuth();
  } else {
    alert("Por favor, introduz o teu nome para entrar!");
  }
};

if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    try {
      localStorage.removeItem('tails_user_raw');
    } catch (err) {}
    currentUser = null;
    if (usernameInput) usernameInput.value = '';
    checkAuth();
  });
}

// ==========================================
// 6. HORA E DATA EM TEMPO REAL
// ==========================================
function updateClock() {
  if (!datetimeDisplay) return;
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
  if (!apiContent) return;
  try {
    const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=38.7167&longitude=-9.1333&current_weather=true');
    const data = await response.json();
    
    if (data && data.current_weather) {
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

if (taskForm) {
  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newTitle = taskTitle ? taskTitle.value.trim() : '';
    if (!newTitle) return;

    const newTask = {
      id: Date.now().toString(),
      title: newTitle,
      category: taskCategory ? taskCategory.value : 'Geral',
      priority: taskPriority ? taskPriority.value : 'media',
      completed: false
    };

    tasks.unshift(newTask);
    saveAndRender();
    if (taskTitle) taskTitle.value = '';
  });
}

window.toggleTask = function(id) {
  tasks = tasks.map(task => {
    if (task.id === id) {
      return { ...task, completed: !task.completed };
    }
    return task;
  });
  saveAndRender();
};

window.deleteTask = function(id) {
  tasks = tasks.filter(task => task.id !== id);
  saveAndRender();
};

window.openEditModal = function(id) {
  const task = tasks.find(t => t.id === id);
  if (!task || !editModal) return;

  if (editTaskId) editTaskId.value = task.id;
  if (editTaskTitle) editTaskTitle.value = task.title;
  if (editTaskCategory) editTaskCategory.value = task.category;
  if (editTaskPriority) editTaskPriority.value = task.priority;

  editModal.classList.remove('hidden');
};

if (closeModalBtn) {
  closeModalBtn.addEventListener('click', () => {
    if (editModal) editModal.classList.add('hidden');
  });
}

if (editForm) {
  editForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = editTaskId ? editTaskId.value : '';
    
    tasks = tasks.map(t => {
      if (t.id === id) {
        return {
          ...t,
          title: editTaskTitle ? editTaskTitle.value.trim() : t.title,
          category: editTaskCategory ? editTaskCategory.value : t.category,
          priority: editTaskPriority ? editTaskPriority.value : t.priority
        };
      }
      return t;
    });

    if (editModal) editModal.classList.add('hidden');
    saveAndRender();
  });
}

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

if (clearCompletedBtn) {
  clearCompletedBtn.addEventListener('click', () => {
    tasks = tasks.filter(t => !t.completed);
    saveAndRender();
  });
}

// ==========================================
// 10. RENDERIZAÇÃO DA INTERFACE
// ==========================================
function renderTasks() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const active = total - completed;

  if (countAll) countAll.textContent = total;
  if (countActive) countActive.textContent = active;
  if (countCompleted) countCompleted.textContent = completed;

  let filteredTasks = tasks;
  if (currentFilter === 'active') {
    filteredTasks = tasks.filter(t => !t.completed);
  } else if (currentFilter === 'completed') {
    filteredTasks = tasks.filter(t => t.completed);
  }

  if (!taskList) return;
  taskList.innerHTML = '';

  if (filteredTasks.length === 0) {
    if (emptyState) emptyState.classList.remove('hidden');
  } else {
    if (emptyState) emptyState.classList.add('hidden');
    
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
