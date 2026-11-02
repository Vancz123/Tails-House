// ==========================================
// OFICINA DO TAILS - SCRIPT UNIFICADO & COMPLETO
// (Sem necessidade de scripts inline no HTML)
// ==========================================

let tasks = [];
let currentUser = null;
let currentFilter = 'all';

// ==========================================
// 1. VERIFICAÇÃO CRÍTICA DE AUTENTICAÇÃO (Evita recarregamento duplo)
// ==========================================
(function checkCriticalAuthEarly() {
  try {
    const savedUser = localStorage.getItem('tails_user_raw');
    if (savedUser && savedUser.trim() !== '') {
      currentUser = savedUser.trim();
      // Aplica imediatamente a propriedade para esconder o ecrã de login
      document.documentElement.style.setProperty('--initial-login-display', 'none');
    }
  } catch (err) {
    console.warn("LocalStorage inacessível na verificação inicial:", err);
  }
})();

// ==========================================
// 2. GESTÃO DE DADOS (SEM JSON NO LOCALSTORAGE)
// ==========================================
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
    console.warn("Erro ao gravar tarefas:", err);
  }
}

// ==========================================
// 3. CONTROLO DE AUTENTICAÇÃO E INTERFACE
// ==========================================
function checkAuth() {
  const loginScreen = document.getElementById('loginScreen');
  const userGreetingText = document.getElementById('userGreetingText');
  let savedUser = null;

  try {
    savedUser = localStorage.getItem('tails_user_raw');
  } catch (err) {}

  currentUser = savedUser || currentUser;

  if (currentUser && currentUser.trim() !== '') {
    if (loginScreen) {
      loginScreen.style.setProperty('display', 'none', 'important');
      loginScreen.classList.add('hidden');
    }
    if (userGreetingText) {
      userGreetingText.textContent = `Olá, ${currentUser}!`;
    }
  } else {
    if (loginScreen) {
      loginScreen.style.setProperty('display', 'flex', 'important');
      loginScreen.classList.remove('hidden');
    }
  }
}

window.fazerLogin = function() {
  const usernameInput = document.getElementById('usernameInput');
  const name = usernameInput ? usernameInput.value.trim() : '';

  if (name !== '') {
    currentUser = name;
    try {
      localStorage.setItem('tails_user_raw', currentUser);
    } catch (err) {}
    checkAuth();
  } else {
    alert("Por favor, introduz o teu nome para entrar na Oficina!");
  }
};

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
  const editModal = document.getElementById('editModal');
  if (!task || !editModal) return;

  document.getElementById('editTaskId').value = task.id;
  document.getElementById('editTaskTitle').value = task.title;
  document.getElementById('editTaskCategory').value = task.category;
  document.getElementById('editTaskPriority').value = task.priority;

  editModal.classList.remove('hidden');
  editModal.style.display = 'flex';
};

function saveAndRender() {
  saveTasksToStorage(tasks);
  renderTasks();
}

// ==========================================
// 4. RENDERIZAÇÃO E FILTRAGEM
// ==========================================
function renderTasks() {
  const taskList = document.getElementById('taskList');
  const emptyState = document.getElementById('emptyState');
  const countAll = document.getElementById('countAll');
  const countActive = document.getElementById('countActive');
  const countCompleted = document.getElementById('countCompleted');

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

// ==========================================
// 5. INTEGRAÇÃO COM API EXTERNA
// ==========================================
async function fetchExternalAPI() {
  const apiContent = document.getElementById('apiContent');
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
// 6. GESTÃO DE TEMA (CLARO / ESCURO)
// ==========================================
function initTheme() {
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  let savedTheme = 'dark';
  try {
    savedTheme = localStorage.getItem('tails_theme_raw') || 'dark';
  } catch (err) {}

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

// ==========================================
// 7. INICIALIZAÇÃO E EVENTOS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  tasks = getTasksFromStorage();

  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) {
    loginBtn.addEventListener('click', window.fazerLogin);
  }

  const usernameInput = document.getElementById('usernameInput');
  if (usernameInput) {
    usernameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        window.fazerLogin();
      }
    });
  }

  const logoutBtn = document.getElementById('logoutBtn');
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

  const themeToggleBtn = document.getElementById('themeToggleBtn');
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

  const taskForm = document.getElementById('taskForm');
  if (taskForm) {
    taskForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const taskTitle = document.getElementById('taskTitle');
      const taskCategory = document.getElementById('taskCategory');
      const taskPriority = document.getElementById('taskPriority');

      const title = taskTitle ? taskTitle.value.trim() : '';
      if (!title) return;

      tasks.unshift({
        id: Date.now().toString(),
        title: title,
        category: taskCategory ? taskCategory.value : 'Geral',
        priority: taskPriority ? taskPriority.value : 'media',
        completed: false
      });

      saveAndRender();
      if (taskTitle) taskTitle.value = '';
    });
  }

  const closeModalBtn = document.getElementById('closeModalBtn');
  const editModal = document.getElementById('editModal');
  if (closeModalBtn && editModal) {
    closeModalBtn.addEventListener('click', () => {
      editModal.classList.add('hidden');
      editModal.style.display = 'none';
    });
  }

  const editForm = document.getElementById('editForm');
  if (editForm) {
    editForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('editTaskId').value;
      const title = document.getElementById('editTaskTitle').value.trim();
      const category = document.getElementById('editTaskCategory').value;
      const priority = document.getElementById('editTaskPriority').value;

      tasks = tasks.map(t => {
        if (t.id === id) {
          return { ...t, title, category, priority };
        }
        return t;
      });

      if (editModal) {
        editModal.classList.add('hidden');
        editModal.style.display = 'none';
      }
      saveAndRender();
    });
  }

  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderTasks();
    });
  });

  const clearCompletedBtn = document.getElementById('clearCompletedBtn');
  if (clearCompletedBtn) {
    clearCompletedBtn.addEventListener('click', () => {
      tasks = tasks.filter(t => !t.completed);
      saveAndRender();
    });
  }

  const datetimeDisplay = document.getElementById('datetime');
  function updateClock() {
    if (!datetimeDisplay) return;
    const now = new Date();
    datetimeDisplay.textContent = now.toLocaleString('pt-PT', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  }

  initTheme();
  checkAuth();
  updateClock();
  setInterval(updateClock, 1000);
  fetchExternalAPI();
  renderTasks();
});
