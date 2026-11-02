// ==========================================
// OFICINA DO TAILS - SCRIPT COMPLETO E DOCUMENTADO
// ==========================================

// Variáveis de Estado Global da Aplicação
let tasks = [];         // Array em memória para armazenar as tarefas do utilizador atual
let currentUser = null; // Nome do piloto autenticado no momento
let currentFilter = 'all'; // Filtro ativo atual ('all', 'active', 'completed')
let currentLang = 'pt';    // Idioma atual do sistema ('pt' ou 'en')

// Dicionário de Traduções Bilingue (PT / EN)
// Contém todas as strings estáticas e dinâmicas da interface
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
    weatherWind: "Flight Wind (Tornado)",
    badgeWorkshop: "Workshop",
    badgeMission: "Mission",
    badgeGeneral: "General"
  }
};

/**
 * Função Auto-Executável (IIFE) - Verificação Inicial Síncrona
 * Objetivo: Verifica antecipadamente no LocalStorage se existe um utilizador autenticado 
 * e um idioma guardado, evitando o efeito visual de flash (piscar a janela de login).
 */
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

/**
 * Traduz e normaliza a categoria da tarefa para o idioma atual.
 * @param {string} cat - Categoria original guardada.
 * @returns {string} Categoria traduzida para exibição em badge.
 */
function getLocalizedCategory(cat) {
  const t = translations[currentLang];
  if (!cat) return t.badgeGeneral;
  const lower = cat.toLowerCase();
  if (lower.includes('oficina') || lower.includes('workshop')) return t.badgeWorkshop;
  if (lower.includes('missão') || lower.includes('mission')) return t.badgeMission;
  return t.badgeGeneral;
}

/**
 * Atualiza todos os textos da interface gráfica com base no idioma selecionado (currentLang).
 * Garante que títulos, botões, opções de select e estados do sistema mudam instantaneamente.
 */
function updateTexts() {
  const t = translations[currentLang];

  // Atualiza as opções dos menus de Categoria
  document.querySelectorAll('#taskCategory, #editTaskCategory').forEach(select => {
    if (select.options[0]) select.options[0].text = t.catWorkshop;
    if (select.options[1]) select.options[1].text = t.catMission;
    if (select.options[2]) select.options[2].text = t.catGeneral;
  });

  // Atualiza as opções dos menus de Prioridade
  document.querySelectorAll('#taskPriority, #editTaskPriority').forEach(select => {
    if (select.options[0]) select.options[0].text = t.prioLow;
    if (select.options[1]) select.options[1].text = t.prioMed;
    if (select.options[2]) select.options[2].text = t.prioHigh;
  });

  const subTitleEl = document.getElementById('workshopSub');
  if (subTitleEl) subTitleEl.textContent = t.workshopSub;

  const greetingEl = document.getElementById('userGreetingText');
  if (greetingEl && currentUser) greetingEl.textContent = `${t.greeting}, ${currentUser}!`;

  const subGreeting = document.querySelector('.user-greeting p');
  if (subGreeting) subGreeting.textContent = t.greetingSub;

  const radarTitleEl = document.querySelector('.api-header');
  if (radarTitleEl) radarTitleEl.innerHTML = `<i class="fa-solid fa-satellite-dish"></i> ${t.radarTitle}`;

  const apiContent = document.getElementById('apiContent');
  if (apiContent && apiContent.innerHTML.includes('fa-spinner')) {
    apiContent.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${t.radarLoading}`;
  }

  const taskTitleInput = document.getElementById('taskTitle');
  if (taskTitleInput) taskTitleInput.placeholder = t.placeholderTitle;

  const formCardTitle = document.querySelector('.form-card h3');
  if (formCardTitle) formCardTitle.innerHTML = `<i class="fa-solid fa-plus"></i> ${t.newMission}`;

  const addBtn = document.querySelector('#taskForm .btn-primary');
  if (addBtn) addBtn.innerHTML = `<i class="fa-solid fa-plus"></i> ${t.btnAdd}`;

  // Atualiza os botões de filtro com as contagens atuais
  const countAllVal = document.getElementById('countAll') ? document.getElementById('countAll').textContent : '0';
  const countActiveVal = document.getElementById('countActive') ? document.getElementById('countActive').textContent : '0';
  const countCompletedVal = document.getElementById('countCompleted') ? document.getElementById('countCompleted').textContent : '0';

  const filterAll = document.querySelector('[data-filter="all"]');
  if (filterAll) filterAll.innerHTML = `${t.all} (<span id="countAll">${countAllVal}</span>)`;

  const filterActive = document.querySelector('[data-filter="active"]');
  if (filterActive) filterActive.innerHTML = `${t.active} (<span id="countActive">${countActiveVal}</span>)`;

  const filterCompleted = document.querySelector('[data-filter="completed"]');
  if (filterCompleted) filterCompleted.innerHTML = `${t.completed} (<span id="countCompleted">${countCompletedVal}</span>)`;

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

  const langBtnText = document.getElementById('langBtnText');
  if (langBtnText) langBtnText.textContent = currentLang.toUpperCase();
}

/**
 * Lê e filtra as tarefas do LocalStorage de forma isolada por utilizador.
 * @returns {Array} Array contendo apenas as tarefas pertencentes ao `currentUser`.
 */
function getTasks() {
  try {
    if (!currentUser) return [];
    const allTasks = JSON.parse(localStorage.getItem('tails_tasks_json') || '[]');
    return allTasks.filter(item => item.user && item.user.toLowerCase() === currentUser.toLowerCase());
  } catch (e) {
    return [];
  }
}

/**
 * Guarda o estado atual das tarefas no LocalStorage em formato JSON serializado.
 * Mantém intactas as tarefas de outros utilizadores que partilhem o mesmo navegador.
 */
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

/**
 * Controla o estado de autenticação e visibilidade do ecrã de login.
 * Se houver utilizador ativo, oculta o overlay e carrega as tarefas; caso contrário, exibe o login.
 */
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

/**
 * Executa o login do utilizador validando o campo de texto do terminal.
 */
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

/**
 * Altera o estado de conclusão (ativo/concluído) de uma tarefa específica pelo ID.
 * @param {string} id - Identificador único da tarefa.
 */
window.toggleTask = function (id) {
  tasks = tasks.map(item => item.id === id ? { ...item, completed: !item.completed } : item);
  saveTasks();
  renderTasks();
};

/**
 * Remove uma tarefa específica do array e atualiza o armazenamento local.
 * @param {string} id - Identificador único da tarefa.
 */
window.deleteTask = function (id) {
  tasks = tasks.filter(item => item.id !== id);
  saveTasks();
  renderTasks();
};

/**
 * Abre a janela modal de edição e preenche os campos com os dados atuais da tarefa selecionada.
 * @param {string} id - Identificador único da tarefa.
 */
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

/**
 * Renderiza dinamicamente a lista de tarefas no DOM, calculando contagens e aplicando filtros.
 */
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

/**
 * Sanitiza strings de texto inseridas pelo utilizador para prevenir injeção de HTML/XSS.
 * @param {string} str - Texto original.
 * @returns {string} Texto seguro contra injeção.
 */
function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}

/**
 * Consome de forma assíncrona a API pública Open-Meteo para obter dados meteorológicos em tempo real.
 */
async function fetchWeather() {
  const box = document.getElementById('apiContent');
  if (!box) return;
  const t = translations[currentLang];
  try {
    const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=38.7167&longitude=-9.1333&current_weather=true');
    const data = await res.json();
    if (data && data.current_weather) {
      box.innerHTML = `<div><strong>${t.weatherTemp}:</strong> ${data.current_weather.temperature}°C</div><div><strong>${t.weatherWind}:</strong> ${data.current_weather.windspeed} km/h</div>`;
    }
  } catch (e) {
    box.innerHTML = `<div><i class="fa-solid fa-triangle-exclamation"></i> ${t.radarOffline}</div>`;
  }
}

// Event Listeners e Inicialização Global ao carregar o DOM
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  fetchWeather();

  // Injeção dinâmica do botão de mudança de idioma no cabeçalho
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
    });
    headerControls.insertBefore(langBtn, headerControls.firstChild);
  }

  // Gestão de Tema (Modo Escuro / Claro)
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

  // Eventos de Autenticação (Login e Logout)
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

  // Evento de Submissão para Criar Nova Tarefa
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

  // Evento de Submissão do Formulário de Edição (Modal)
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

  // Gestão de Filtros de Visualização
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      const target = e.currentTarget;
      target.classList.add('active');
      currentFilter = target.dataset.filter || 'all';
      renderTasks();
    });
  });

  // Botão para limpar tarefas concluídas em lote
  document.getElementById('clearCompletedBtn')?.addEventListener('click', () => {
    tasks = tasks.filter(t => !t.completed);
    saveTasks();
    renderTasks();
  });

  // Relógio Dinâmico em tempo real no cabeçalho
  setInterval(() => {
    const clock = document.getElementById('datetime');
    if (clock) {
      clock.textContent = new Date().toLocaleString(currentLang === 'pt' ? 'pt-PT' : 'en-US', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
    }
  }, 1000);
});