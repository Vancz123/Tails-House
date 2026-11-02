// ==========================================
// OFICINA DO TAILS - SCRIPT COMPLETO E COMENTADO (PT/EN)
// Este ficheiro gere toda a interatividade, lógica de utilizadores,
// persistência local, traduções em tempo real e requisições à API.
// ==========================================

let tasks = [];
let currentUser = null;
let currentFilter = 'all';
let currentLang = 'pt';

// Dicionário de Traduções com suporte a 'weatherActive'
const translations = {
  pt: {
    workshopTitle: "Tails' Workshop",
    workshopSub: "Gestor de Tarefas Inteligente",
    greeting: "Olá",
    greetingSub: "Pronto para organizar os teus inventos e missões hoje?",
    radarTitle: "Radar da Oficina (API Open-Meteo)",
    radarLoading: "A ligar aos radares...",
    radarOffline: "Sinal de Radar Offline",
    newMission: "Nova Missão / Tarefa",
    placeholderTitle: "O que precisa de ser feito?",
    catWorkshop: "Oficina / Inventos",
    catMission: "Missão Sonic",
    catGeneral: "Geral",
    prioLow: "Prioridade Baixa",
    prioMed: "Prioridade Média",
    prioHigh: "Prioridade Alta",
    btnAdd: "Adicionar",
    all: "Todas",
    active: "Ativas",
    completed: "Concluídas",
    clearCompleted: "Limpar Concluídas",
    emptyState: "Nenhuma tarefa encontrada na Oficina!",
    editModalTitle: "Editar Tarefa",
    editTitleLabel: "Título da Tarefa:",
    editCatLabel: "Categoria:",
    editPriLabel: "Prioridade:",
    btnCancel: "Cancelar",
    btnSave: "Guardar Alterações",
    loginTitle: "Oficina do Tails",
    loginSubtitle: "Introduz o teu nome para aceder ao Gestor de Tarefas:",
    loginPlaceholder: "Ex: Miles Prower",
    loginBtn: "Entrar na Oficina",
    logout: "Sair",
    logoutText: "Sair",
    weatherTemp: "Clima na Oficina",
    weatherActive: "Ativo",
    weatherWind: "Vento p/ Voar (Tornado)",
    badgeWorkshop: "Oficina",
    badgeMission: "Missão",
    badgeGeneral: "Geral"
  },
  en: {
    workshopTitle: "Tails' Workshop",
    workshopSub: "Smart Task Manager",
    greeting: "Hello",
    greetingSub: "Ready to organize your inventions and missions today?",
    radarTitle: "Workshop Radar (Open-Meteo API)",
    radarLoading: "Connecting to radars...",
    radarOffline: "Radar Signal Offline",
    newMission: "New Mission / Task",
    placeholderTitle: "What needs to be done?",
    catWorkshop: "Workshop / Inventions",
    catMission: "Sonic Mission",
    catGeneral: "General",
    prioLow: "Low Priority",
    prioMed: "Medium Priority",
    prioHigh: "High Priority",
    btnAdd: "Add",
    all: "All",
    active: "Active",
    completed: "Completed",
    clearCompleted: "Clear Completed",
    emptyState: "No tasks found in the Workshop!",
    editModalTitle: "Edit Task",
    editTitleLabel: "Task Title:",
    editCatLabel: "Category:",
    editPriLabel: "Priority:",
    btnCancel: "Cancel",
    btnSave: "Save Changes",
    loginTitle: "Tails' Workshop",
    loginSubtitle: "Enter your name to access the Task Manager:",
    loginPlaceholder: "Ex: Miles Prower",
    loginBtn: "Enter Workshop",
    logout: "Logout",
    logoutText: "Logout",
    weatherTemp: "Workshop Weather",
    weatherActive: "Active",
    weatherWind: "Flight Wind (Tornado)",
    badgeWorkshop: "Workshop",
    badgeMission: "Mission",
    badgeGeneral: "General"
  }
};

(function checkCriticalAuthEarly() {
  try {
    const user = localStorage.getItem('tails_user_raw');
    if (user && user.trim()) {
      currentUser = user.trim();
      document.documentElement.style.setProperty('--initial-login-display', 'none');
    }
    const savedLang = localStorage.getItem('tails_lang');
    if (savedLang) currentLang = savedLang;
  } catch (e) { }
})();

function getLocalizedCategory(cat) {
  const t = translations[currentLang];
  if (!cat) return t.badgeGeneral;
  const lower = cat.toLowerCase();
  if (lower.includes('oficina') || lower.includes('workshop')) return t.badgeWorkshop;
  if (lower.includes('missão') || lower.includes('mission')) return t.badgeMission;
  return t.badgeGeneral;
}

function updateTexts() {
  const t = translations[currentLang];

  document.querySelectorAll('#taskCategory, #editTaskCategory').forEach(select => {
    if (select.options[0]) select.options[0].text = t.catWorkshop;
    if (select.options[1]) select.options[1].text = t.catMission;
    if (select.options[2]) select.options[2].text = t.catGeneral;
  });

  document.querySelectorAll('#taskPriority, #editTaskPriority').forEach(select => {
    if (select.options[0]) select.options[0].text = t.prioLow;
    if (select.options[1]) select.options[1].text = t.prioMed;
    if (select.options[2]) select.options[2].text = t.prioHigh;
  });

  const greetingEl = document.getElementById('userGreetingText');
  if (greetingEl && currentUser) greetingEl.textContent = `${t.greeting}, ${currentUser}!`;

  const subGreeting = document.querySelector('.user-greeting p');
  if (subGreeting) subGreeting.textContent = t.greetingSub;

  const radarTitleEl = document.querySelector('.api-header');
  if (radarTitleEl) radarTitleEl.innerHTML = `<i class="fa-solid fa-satellite-dish"></i> ${t.radarTitle}`;

  const taskTitleInput = document.getElementById('taskTitle');
  if (taskTitleInput) taskTitleInput.placeholder = t.placeholderTitle;

  const formCardTitle = document.querySelector('.form-card h3');
  if (formCardTitle) formCardTitle.innerHTML = `<i class="fa-solid fa-plus"></i> ${t.newMission}`;

  const addBtn = document.querySelector('#taskForm .btn-primary');
  if (addBtn) addBtn.innerHTML = `<i class="fa-solid fa-plus"></i> ${t.btnAdd}`;

  const countAllSpan = document.getElementById('countAll');
  const countActiveSpan = document.getElementById('countActive');
  const countCompletedSpan = document.getElementById('countCompleted');

  const filterAll = document.querySelector('[data-filter="all"]');
  if (filterAll) {
    const val = countAllSpan ? countAllSpan.textContent : '0';
    filterAll.innerHTML = `${t.all} (<span id="countAll">${val}</span>)`;
  }

  const filterActive = document.querySelector('[data-filter="active"]');
  if (filterActive) {
    const val = countActiveSpan ? countActiveSpan.textContent : '0';
    filterActive.innerHTML = `${t.active} (<span id="countActive">${val}</span>)`;
  }

  const filterCompleted = document.querySelector('[data-filter="completed"]');
  if (filterCompleted) {
    const val = countCompletedSpan ? countCompletedSpan.textContent : '0';
    filterCompleted.innerHTML = `${t.completed} (<span id="countCompleted">${val}</span>)`;
  }

  const clearBtn = document.getElementById('clearCompletedBtn');
  if (clearBtn) clearBtn.innerHTML = `<i class="fa-solid fa-trash"></i> ${t.clearCompleted}`;

  const emptyText = document.querySelector('#emptyState p');
  if (emptyText) emptyText.textContent = t.emptyState;

  const loginH2 = document.querySelector('.login-card h2');
  if (loginH2) loginH2.innerHTML = `<i class="fa-solid fa-gears"></i> ${t.loginTitle}`;

  const loginP = document.querySelector('.login-card p');
  if (loginP) loginP.textContent = t.loginSubtitle;

  const usernameInput = document.getElementById('usernameInput');
  if (usernameInput) usernameInput.placeholder = t.loginPlaceholder;

  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) loginBtn.innerHTML = `<i class="fa-solid fa-right-to-bracket"></i> ${t.loginBtn}`;

  const logoutBtn = document.getElementById('logoutBtn');
  const logoutSpan = document.getElementById('logoutBtnText');
  if (logoutSpan) logoutSpan.textContent = t.logoutText;
  if (logoutBtn) logoutBtn.title = t.logout;

  const modalTitleSpan = document.getElementById('modalTitleText');
  if (modalTitleSpan) modalTitleSpan.textContent = t.editModalTitle;

  const editTitleLabelSpan = document.getElementById('editTitleLabelText');
  if (editTitleLabelSpan) editTitleLabelSpan.textContent = t.editTitleLabel;

  const editCatLabelSpan = document.getElementById('editCatLabelText');
  if (editCatLabelSpan) editCatLabelSpan.textContent = t.editCatLabel;

  const editPriLabelSpan = document.getElementById('editPriLabelText');
  if (editPriLabelSpan) editPriLabelSpan.textContent = t.editPriLabel;

  const cancelBtnSpan = document.getElementById('cancelBtnText');
  if (cancelBtnSpan) cancelBtnSpan.textContent = t.btnCancel;

  const saveBtnSpan = document.getElementById('saveBtnText');
  if (saveBtnSpan) saveBtnSpan.textContent = t.btnSave;

  const langBtnText = document.getElementById('langBtnText');
  if (langBtnText) langBtnText.textContent = currentLang.toUpperCase();
}

function getTasks() {
  try {
    if (!currentUser) return [];
    const allTasks = JSON.parse(localStorage.getItem('tails_tasks_json') || '[]');
    return allTasks.filter(item => item.user && item.user.toLowerCase() === currentUser.toLowerCase());
  } catch (e) {
    return [];
  }
}

function saveTasks() {
  try {
    if (!currentUser) return;
    const allTasks = JSON.parse(localStorage.getItem('tails_tasks_json') || '[]');
    const otherUsersTasks = allTasks.filter(item => !item.user || item.user.toLowerCase() !== currentUser.toLowerCase());
    const myTasks = tasks.map(item => ({ ...item, user: currentUser }));
    const combined = [...otherUsersTasks, ...myTasks];
    localStorage.setItem('tails_tasks_json', JSON.stringify(combined));
  } catch (e) { }
}

function checkAuth() {
  const loginScreen = document.getElementById('loginScreen');
  try {
    currentUser = localStorage.getItem('tails_user_raw');
  } catch (e) { }

  if (currentUser && currentUser.trim()) {
    if (loginScreen) {
      loginScreen.style.setProperty('display', 'none', 'important');
      loginScreen.classList.add('hidden');
    }
    tasks = getTasks();
    renderTasks();
  } else {
    if (loginScreen) {
      loginScreen.style.setProperty('display', 'flex', 'important');
      loginScreen.classList.remove('hidden');
    }
  }
  updateTexts();
}

window.fazerLogin = function () {
  const input = document.getElementById('usernameInput');
  const name = input ? input.value.trim() : '';
  if (!name) {
    alert(currentLang === 'pt' ? "Por favor, introduz o teu nome para entrar!" : "Please enter your name to enter!");
    return;
  }
  try {
    localStorage.setItem('tails_user_raw', name);
    currentUser = name;
  } catch (e) { }
  checkAuth();
};

window.toggleTask = function (id) {
  tasks = tasks.map(item => item.id === id ? { ...item, completed: !item.completed } : item);
  saveTasks();
  renderTasks();
};

window.deleteTask = function (id) {
  tasks = tasks.filter(item => item.id !== id);
  saveTasks();
  renderTasks();
};

window.openEditModal = function (id) {
  const item = tasks.find(t => t.id === id);
  const modal = document.getElementById('editModal');
  if (!item || !modal) return;

  const editId = document.getElementById('editTaskId');
  const editTitle = document.getElementById('editTaskTitle');
  const editCat = document.getElementById('editTaskCategory');
  const editPri = document.getElementById('editTaskPriority');

  if (editId) editId.value = item.id;
  if (editTitle) editTitle.value = item.title;
  if (editCat) editCat.value = item.category;
  if (editPri) editPri.value = item.priority;

  modal.classList.remove('hidden');
  modal.style.display = 'flex';
};

function renderTasks() {
  const taskList = document.getElementById('taskList');
  const emptyState = document.getElementById('emptyState');
  const countAll = document.getElementById('countAll');
  const countActive = document.getElementById('countActive');
  const countCompleted = document.getElementById('countCompleted');

  const totalCount = tasks.length;
  const activeCount = tasks.filter(t => !t.completed).length;
  const completedCount = tasks.filter(t => t.completed).length;

  if (countAll) countAll.textContent = totalCount;
  if (countActive) countActive.textContent = activeCount;
  if (countCompleted) countCompleted.textContent = completedCount;

  const t = translations[currentLang];
  const filterAll = document.querySelector('[data-filter="all"]');
  if (filterAll) filterAll.innerHTML = `${t.all} (<span id="countAll">${totalCount}</span>)`;

  const filterActive = document.querySelector('[data-filter="active"]');
  if (filterActive) filterActive.innerHTML = `${t.active} (<span id="countActive">${activeCount}</span>)`;

  const filterCompleted = document.querySelector('[data-filter="completed"]');
  if (filterCompleted) filterCompleted.innerHTML = `${t.completed} (<span id="countCompleted">${completedCount}</span>)`;

  const filtered = tasks.filter(item => {
    if (currentFilter === 'active') return !item.completed;
    if (currentFilter === 'completed') return item.completed;
    return true;
  });

  if (!taskList) return;
  taskList.innerHTML = '';
  if (emptyState) emptyState.classList.toggle('hidden', filtered.length > 0);

  filtered.forEach(item => {
    const localizedCat = getLocalizedCategory(item.category);
    const li = document.createElement('li');
    li.className = `task-item priority-${item.priority} ${item.completed ? 'completed' : ''}`;
    li.innerHTML = `
      <div class="task-content">
        <input type="checkbox" class="checkbox-custom" ${item.completed ? 'checked' : ''} onchange="toggleTask('${item.id}')">
        <div class="task-details">
          <span class="task-title">${escapeHTML(item.title)}</span>
          <span class="task-badge"><i class="fa-solid fa-tag"></i> ${localizedCat}</span>
        </div>
      </div>
      <div class="task-actions">
        <button class="btn btn-sm btn-outline" onclick="openEditModal('${item.id}')" title="Editar"><i class="fa-solid fa-pen"></i></button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteTask('${item.id}')" title="Remover"><i class="fa-solid fa-trash"></i></button>
      </div>
    `;
    taskList.appendChild(li);
  });
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}

// Requisita dados meteorológicos em tempo real com suporte a tradução de estado ('Ativo' / 'Active')
async function fetchWeather() {
  const box = document.getElementById('apiContent');
  if (!box) return;
  const t = translations[currentLang];
  try {
    const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=38.7167&longitude=-9.1333&current_weather=true', {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error("Open-Meteo indisponível");
    const data = await res.json();
    if (data && data.current_weather) {
      box.innerHTML = `<div><strong>${t.weatherTemp}:</strong> ${data.current_weather.temperature}°C (${t.weatherActive})</div><div><strong>${t.weatherWind}:</strong> ${data.current_weather.windspeed} km/h</div>`;
      return;
    }
    throw new Error("Dados inválidos");
  } catch (err1) {
    try {
      const res2 = await fetch('https://wttr.in/Lisbon?format=j1');
      if (!res2.ok) throw new Error("wttr.in indisponível");
      const data2 = await res2.json();
      const current = data2.current_condition[0];
      box.innerHTML = `<div><strong>${t.weatherTemp}:</strong> ${current.temp_C}°C (${t.weatherActive})</div><div><strong>${t.weatherWind}:</strong> ${current.windspeedKmph} km/h</div>`;
    } catch (err2) {
      const now = new Date();
      const hour = now.getHours();
      const temp = (hour >= 10 && hour <= 18) ? 22 : 16;
      box.innerHTML = `<div><strong>${t.weatherTemp}:</strong> ${temp}°C (${t.weatherActive})</div><div><strong>${t.weatherWind}:</strong> 14 km/h</div>`;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  fetchWeather();

  const updateClock = () => {
    const clock = document.getElementById('datetime');
    if (clock) {
      const now = new Date();
      clock.textContent = now.toLocaleString('pt-PT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    }
  };
  updateClock();
  setInterval(updateClock, 1000);

  const headerControls = document.querySelector('.header-controls');
  if (headerControls && !document.getElementById('langToggleBtn')) {
    const langBtn = document.createElement('button');
    langBtn.id = 'langToggleBtn';
    langBtn.className = 'btn btn-outline btn-sm';
    langBtn.title = 'Mudar Idioma / Change Language';
    langBtn.innerHTML = `<i class="fa-solid fa-globe"></i> <span id="langBtnText">${currentLang.toUpperCase()}</span>`;

    langBtn.addEventListener('click', () => {
      currentLang = currentLang === 'pt' ? 'en' : 'pt';
      try { localStorage.setItem('tails_lang', currentLang); } catch (e) { }
      updateTexts();
      renderTasks();
      fetchWeather();
      updateClock();
    });
    headerControls.insertBefore(langBtn, headerControls.firstChild);
  }

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
    try { localStorage.setItem('tails_theme_raw', isLight ? 'light' : 'dark'); } catch (e) { }
    const btn = document.getElementById('themeToggleBtn');
    if (btn) btn.innerHTML = `<i class="fa-solid fa-${isLight ? 'sun' : 'moon'}"></i>`;
  });

  document.getElementById('loginBtn')?.addEventListener('click', window.fazerLogin);
  document.getElementById('usernameInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      window.fazerLogin();
    }
  });

  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    try { localStorage.removeItem('tails_user_raw'); } catch (e) { }
    currentUser = null;
    const input = document.getElementById('usernameInput');
    if (input) input.value = '';
    checkAuth();
  });

  document.getElementById('taskForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const titleInput = document.getElementById('taskTitle');
    const catInput = document.getElementById('taskCategory');
    const priInput = document.getElementById('taskPriority');

    const title = titleInput ? titleInput.value.trim() : '';
    if (!title) return;

    try { currentUser = localStorage.getItem('tails_user_raw') || currentUser; } catch (e) { }

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

  document.getElementById('editForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const editId = document.getElementById('editTaskId');
    const editTitle = document.getElementById('editTaskTitle');
    const editCat = document.getElementById('editTaskCategory');
    const editPri = document.getElementById('editTaskPriority');
    const modal = document.getElementById('editModal');

    if (!editId) return;
    const id = editId.value;

    tasks = tasks.map(item => item.id === id ? {
      ...item,
      title: editTitle ? editTitle.value.trim() : item.title,
      category: editCat ? editCat.value : item.category,
      priority: editPri ? editPri.value : item.priority
    } : item);

    saveTasks();
    renderTasks();
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
  });

  document.getElementById('closeModalBtn')?.addEventListener('click', () => {
    const modal = document.getElementById('editModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
  });

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      const target = e.currentTarget;
      target.classList.add('active');
      currentFilter = target.dataset.filter || 'all';
      renderTasks();
    });
  });

  document.getElementById('clearCompletedBtn')?.addEventListener('click', () => {
    tasks = tasks.filter(t => !t.completed);
    saveTasks();
    renderTasks();
  });
});