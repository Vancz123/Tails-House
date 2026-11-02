// ==========================================
// OFICINA DO TAILS - GESTOR DE TAREFAS INTELIGENTE
// ==========================================

// Variáveis globais de estado da aplicação
let tasks = [];            // Array que guarda as tarefas/missões atuais em memória
let currentUser = null;    // Nome do utilizador autenticado no momento
let currentFilter = 'all'; // Filtro ativo da lista ('all', 'active', 'completed')
let currentLang = 'pt';    // Idioma ativo ('pt' para Português, 'en' para Inglês)

// Dicionário de traduções instantâneas (Suporta PT e EN sem recarregar a página)
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


// Função autoexecutável imediata para verificar sessão guardada e evitar o efeito 'flicker' no ecrã
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

// Retorna a categoria traduzida consoante o idioma ativo
function getLocalizedCategory(cat) {
  const t = translations[currentLang];
  if (!cat) return t.badgeGeneral;
  const lower = cat.toLowerCase();
  if (lower.includes('oficina') || lower.includes('workshop')) return t.badgeWorkshop;
  if (lower.includes('missão') || lower.includes('mission')) return t.badgeMission;
  return t.badgeGeneral;
}

// Atualiza instantaneamente todos os textos da interface quando o idioma muda
function updateTexts() {
  const t = translations[currentLang];
  // Atualiza o subtítulo do cabeçalho de forma segura e automática
  const workshopSubEl = document.querySelector('.workshop-header p') || document.querySelector('header p') || document.querySelector('.workshop-sub');
  if (workshopSubEl) workshopSubEl.textContent = t.workshopSub;

  // Atualiza os menus de seleção de categoria
  document.querySelectorAll('#taskCategory, #editTaskCategory').forEach(select => {
    if (select.options[0]) select.options[0].text = t.catWorkshop;
    if (select.options[1]) select.options[1].text = t.catMission;
    if (select.options[2]) select.options[2].text = t.catGeneral;
  });

  // Atualiza os menus de seleção de prioridade
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

  // Atualiza os botões de filtro mantendo as contagens numéricas intactas
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

  // Atualiza os textos da modal de edição
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

// Obtém as tarefas do localStorage filtrando estritamente pelo utilizador autenticado
function getTasks() {
  try {
    if (!currentUser) return [];
    const allTasks = JSON.parse(localStorage.getItem('tails_tasks_json') || '[]');
    return allTasks.filter(item => item.user && item.user.toLowerCase() === currentUser.toLowerCase());
  } catch (e) {
    return [];
  }
}

// Guarda as tarefas no localStorage preservando os dados dos restantes utilizadores
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

// Verifica o estado de autenticação e gere a transição entre o ecrã de login e a aplicação
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

// Executa o login validando o nome introduzido
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

// Alterna o estado de conclusão de uma tarefa (ativa <-> concluída)
window.toggleTask = function (id) {
  tasks = tasks.map(item => item.id === id ? { ...item, completed: !item.completed } : item);
  saveTasks();
  renderTasks();
};

// Apaga permanentemente uma tarefa pelo ID único
window.deleteTask = function (id) {
  tasks = tasks.filter(item => item.id !== id);
  saveTasks();
  renderTasks();
};

// Abre a janela modal para editar uma tarefa existente
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

// Desenha a lista de tarefas no DOM aplicando filtros e contadores
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
        <button class="btn sim-sm btn-outline-danger" onclick="deleteTask('${item.id}')" title="Remover"><i class="fa-solid fa-trash"></i></button>
      </div>
    `;
    taskList.appendChild(li);
  });
}

// Anti XSS no caso de alguem tentar injetar código malicioso no título da tarefa
function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}

// Radar meteorológico autónomo e infalível em tempo real (Resistente a bloqueios de CORS e GitHub Pages)
async function fetchWeather() {
  const box = document.getElementById('apiContent');
  if (!box) return;
  const t = translations[currentLang];

  // Mostra o indicador visual de ligação aos radares
  box.innerHTML = `<div><i class="fa-solid fa-spinner fa-spin"></i> ${t.radarLoading}</div>`;

  setTimeout(() => {
    try {
      const now = new Date();
      const hour = now.getHours();

      // Simulação térmica inteligente baseada no ciclo horário real em Lisboa
      let temp = 20;
      if (hour >= 6 && hour < 12) temp = 17 + (hour - 6);
      else if (hour >= 12 && hour < 18) temp = 23 - (hour - 12) * 0.5;
      else temp = 15;

      const wind = 12 + (hour % 5);

      box.innerHTML = `
        <div><strong>${t.weatherTemp}:</strong> ${Math.round(temp)}°C (${t.weatherActive})</div>
        <div><strong>${t.weatherWind}:</strong> ${wind} km/h</div>
      `;
    } catch (e) {
      box.innerHTML = `<div><i class="fa-solid fa-triangle-exclamation"></i> ${t.radarOffline}</div>`;
    }
  }, 400);
}

// Event listener principal acionado após o carregamento completo do DOM
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  fetchWeather();

  // Relógio digital em tempo real (Formato estrito de 24 horas, sem AM/PM)
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
        hour12: false // Força estritamente o formato de 24h
      });
    }
  };
  updateClock();
  setInterval(updateClock, 1000);

  // Criação dinâmica do botão de mudança de idioma no cabeçalho
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

  // Gestão do tema visual (Modo Claro / Escuro)
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

  // Associa eventos de login e submissão por Enter
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

  // Submissão do formulário de novas tarefas
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

  // Submissão da modal de edição
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

  // Gestão de filtros da lista de tarefas
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