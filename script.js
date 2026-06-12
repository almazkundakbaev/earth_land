const STORAGE_KEY = "landProjects.v1";
const API_TOKEN_KEY = "landProjects.apiToken";

const apiConfig = window.API_CONFIG || {};
const apiBaseUrl = (apiConfig.baseUrl || "").replace(/\/$/, "");
const isApiConfigured = Boolean(apiBaseUrl);

const state = {
  projects: [],
  activeId: null,
  selectedIds: new Set(),
  deleteMode: false,
  view: "cabinet",
  user: null,
  profile: null,
  serverMode: false,
  users: [],
  apiToken: localStorage.getItem(API_TOKEN_KEY) || "",
  saveTimer: null,
  map: {
    centerLat: 43.2389,
    centerLng: 76.8897,
    zoom: 8,
    mode: "move",
    dragStart: null,
    moved: false,
    suppressClickUntil: 0,
  },
  currentFileItem: null,
};

const elements = {
  authView: document.querySelector("#authView"),
  appShell: document.querySelector("#appShell"),
  authForm: document.querySelector("#authForm"),
  authEmail: document.querySelector("#authEmail"),
  authPassword: document.querySelector("#authPassword"),
  authTitle: document.querySelector("#authTitle"),
  serverStatus: document.querySelector("#serverStatus"),
  headerMenuBtn: document.querySelector("#headerMenuBtn"),
  headerMenu: document.querySelector("#headerMenu"),
  headerUserName: document.querySelector("#headerUserName"),
  headerUserLogin: document.querySelector("#headerUserLogin"),
  headerUserRole: document.querySelector("#headerUserRole"),
  signOutBtn: document.querySelector("#signOutBtn"),
  cabinetPanel: document.querySelector("#cabinetPanel"),
  cabinetTitle: document.querySelector("#cabinetTitle"),
  cabinetRole: document.querySelector("#cabinetRole"),
  cabinetUserEmail: document.querySelector("#cabinetUserEmail"),
  cabinetUserName: document.querySelector("#cabinetUserName"),
  cabinetProjects: document.querySelector("#cabinetProjects"),
  cabinetUsers: document.querySelector("#cabinetUsers"),
  cabinetUsersCard: document.querySelector("#cabinetUsersCard"),
  goProjectsBtn: document.querySelector("#goProjectsBtn"),
  goUsersBtn: document.querySelector("#goUsersBtn"),
  backToCabinetFromProjectsBtn: document.querySelector("#backToCabinetFromProjectsBtn"),
  backToCabinetFromUsersBtn: document.querySelector("#backToCabinetFromUsersBtn"),
  userAdminPanel: document.querySelector("#userAdminPanel"),
  createUserForm: document.querySelector("#createUserForm"),
  newUserFullName: document.querySelector("#newUserFullName"),
  newUserEmail: document.querySelector("#newUserEmail"),
  newUserPassword: document.querySelector("#newUserPassword"),
  newUserRole: document.querySelector("#newUserRole"),
  userSearchInput: document.querySelector("#userSearchInput"),
  userList: document.querySelector("#userList"),
  registryView: document.querySelector("#registryView"),
  detailView: document.querySelector("#detailView"),
  tableBody: document.querySelector("#projectTableBody"),
  form: document.querySelector("#projectForm"),
  search: document.querySelector("#searchInput"),
  mapFrame: document.querySelector("#mapFrame"),
  imageInput: document.querySelector("#imageInput"),
  documentInput: document.querySelector("#documentInput"),
  exportBtn: document.querySelector("#exportBtn"),
  importInput: document.querySelector("#importInput"),
  statusPickerBtn: document.querySelector("#statusPickerBtn"),
  statusPickerText: document.querySelector("#statusPickerText"),
  statusDropdown: document.querySelector("#statusDropdown"),
  paramModal: document.querySelector("#paramModal"),
  paramModalEyebrow: document.querySelector("#paramModalEyebrow"),
  paramModalTitle: document.querySelector("#paramModalTitle"),
  paramModalNote: document.querySelector("#paramModalNote"),
  paramModalBody: document.querySelector("#paramModalBody"),
  closeParamModalBtn: document.querySelector("#closeParamModalBtn"),
  mapModalTemplate: document.querySelector("#mapModalTemplate"),
  imagesModalTemplate: document.querySelector("#imagesModalTemplate"),
  documentsModalTemplate: document.querySelector("#documentsModalTemplate"),
  imageGrid: document.querySelector("#imageGrid"),
  documentList: document.querySelector("#documentList"),
  newProjectBtn: document.querySelector("#newProjectBtn"),
  deleteSelectedBtn: document.querySelector("#deleteSelectedBtn"),
  cancelDeleteBtn: document.querySelector("#cancelDeleteBtn"),
  backToRegistryBtn: document.querySelector("#backToRegistryBtn"),
  saveProjectBtn: document.querySelector("#saveProjectBtn"),
  deleteBtn: document.querySelector("#deleteBtn"),
  drawAreaBtn: document.querySelector("#drawAreaBtn"),
  clearAreaBtn: document.querySelector("#clearAreaBtn"),
  saveMapBtn: document.querySelector("#saveMapBtn"),
};

elements.projectTable = document.querySelector("#projectTable") || elements.tableBody?.closest("table");

const fields = ["title", "address", "status", "responsible", "area"];
const defaultSections = [
  {
    title: "1. Идентификация участка",
    subtitle: "Базовые реквизиты земли",
    items: [
      ["Кадастровый номер", "Официальный ID участка", true],
      ["GPS-координаты", "Точка входа + полигон границ", true, false, "map"],
      ["Категория целевого назначения", "Сельхоз / промышл. / турист. и др.", true],
    ],
  },
  {
    title: "2. Цель и формат сделки",
    subtitle: "Намерения стороны, предлагающей участок",
    items: [
      ["Тип сделки", "Продажа / аренда / партнёрство / СП", true],
      ["Запрашиваемая цена", "За участок / за га / условия", true],
      ["Ожидания партнёра", "Доля, роль, вклад в проект", true],
      ["Сроки", "Готовность к сделке, дедлайны", true, false, "deadline"],
    ],
  },
  {
    title: "3. Правовые документы",
    subtitle: "Юридическая чистота и статус прав",
    items: [
      ["Документы и файлы", "Загрузка и просмотр всех документов участка", true, false, "documents"],
      ["Акт на землю (госакт)", "Право собственности или аренды", true, false, "documents"],
      ["Правоустанавливающий документ", "Основание возникновения права", false, false, "documents"],
      ["Кадастровый паспорт / план", "Межевание, план участка", false, false, "documents"],
      ["Обременения / ограничения", "Залог, арест, сервитут, охр. зоны", false, false, "documents"],
      ["Данные собственника", "ФЛ / ЮЛ, БИН/ИИН, история", false, false, "documents"],
      ["Другое", "Дополнительные правовые документы", false, false, "documents"],
    ],
  },
  {
    title: "4. Контактная информация",
    subtitle: "Со стороны предложившего участок",
    items: [
      ["Имя контактного лица", "Собственник / брокер / представитель", true],
      ["Телефон", "", true],
      ["Email", "Для документооборота", true],
      ["Организация / роль", "Если юридическое лицо", true],
    ],
  },
  {
    title: "5. Визуальные материалы",
    subtitle: "Фото, видео, схемы",
    items: [
      ["Фото участка", "Общий вид, рельеф, въезд, периметр", true, false, "images"],
      ["Аэросъёмка / спутник", "Google Maps, 2GIS, дрон при наличии", false, false, "images"],
      ["Схема участка / ситуационный план", "Привязка к окружению, дорогам", false, false, "images"],
      ["Видеообзор", "Проезд, панорама, состояние", false, true, "images"],
    ],
  },
  {
    title: "6. Инфраструктура и инженерия",
    subtitle: "Наличие, удалённость, стоимость подключения",
    items: [
      ["Водоснабжение", "Централизованное / скважина / привозная"],
      ["Электроэнергия", "КВт мощность, расстояние до ПС"],
      ["Газоснабжение", "Магистральный / сжиженный / нет"],
      ["Канализация / сточные воды", "Централизованная / локальные сооружения"],
      ["Связь / интернет", "Сотовая, оптика, спутник"],
      ["Дороги — тип покрытия", "Асфальт / грунт / отсутствует"],
      ["Дороги — состояние", "Проходимость: круглогодичная / сезонная"],
      ["Расстояние до н.п.", "До ближ. города / районного центра, км"],
    ],
  },
  {
    title: "7. Физические характеристики",
    subtitle: "Рельеф, природа, состояние участка",
    items: [
      ["Рельеф", "Ровный / холмистый / склон / перепад"],
      ["Растительность", "Степь / лес / кустарник / голое"],
      ["Водоёмы / гидрология", "Река, озеро, заболоченность"],
      ["Климатическая зона / сезонность", "Засухоустойчивость, морозы"],
      ["Ограждение", "Забор, охрана, периметр"],
      ["Строения на участке", "Здания, сооружения, их состояние"],
    ],
  },
  {
    title: "8. Коммерческий потенциал",
    subtitle: "Оценочные параметры для решения",
    items: [
      ["Туристический потенциал", "Аттракторы, близость маршрутов"],
      ["Девелоперский потенциал", "ВРИ, разрешённая плотность застройки"],
      ["Рыночная стоимость / кв. м / га", "Аналоги, кадастровая стоимость"],
      ["Риски", "Экология, охр. зоны, оползни, паводки"],
    ],
  },
];
moveSectionAfterIdentification("Контактная");
orderDefaultSections([
  "РљРѕРЅС‚Р°РєС‚РЅР°СЏ",
  "РРґРµРЅС‚РёС„РёРєР°С†РёСЏ",
  "Р¤РёР·РёС‡РµСЃРєРёРµ",
  "РРЅС„СЂР°СЃС‚СЂСѓРєС‚СѓСЂР°",
]);
renumberDefaultSections();

const statusPhases = [
  {
    phase: "Фаза 1 — Входящая заявка",
    statuses: ["Входящий", "В работе", "Анализ"],
  },
  {
    phase: "Фаза 2 — Полевая оценка",
    statuses: ["Запланировано", "Завершён", "Решение"],
  },
  {
    phase: "Фаза 3 — Коммерческое согласование",
    statuses: ["Активно", "Переговоры", "Согласовано", "Проверка"],
  },
  {
    phase: "Фаза 4 — Юридическое оформление",
    statuses: ["Подготовка", "Согласование", "У нотариуса", "Регистрация"],
  },
  {
    phase: "Финальные статусы",
    statuses: ["Закрыто", "Отказ", "Пауза", "Сорвалась"],
  },
];

init();

function moveSectionAfterIdentification(titlePart) {
  const currentIndex = defaultSections.findIndex((section) => section.title.includes(titlePart));

  if (currentIndex <= 0) {
    return;
  }

  const [section] = defaultSections.splice(currentIndex, 1);
  defaultSections.splice(1, 0, section);
}

function orderDefaultSections(titleParts) {
  const matchers = [
    (section) => section.items.some(([label]) => label === "Email"),
    (section) => section.items.some((item) => item[4] === "map"),
    (section) => section.items.length === 6 && section.items.every((item) => !item[4]),
    (section) => section.items.length === 8 && section.items.every((item) => !item[4]),
  ];
  const ordered = [];

  matchers.forEach((matcher) => {
    const index = defaultSections.findIndex(matcher);

    if (index >= 0) {
      ordered.push(...defaultSections.splice(index, 1));
    }
  });

  defaultSections.unshift(...ordered);
}

function renumberDefaultSections() {
  defaultSections.forEach((section, index) => {
    section.title = section.title.replace(/^\d+\.\s*/, `${index + 1}. `);
  });
}

async function init() {
  bindEvents();

  await loadCurrentUserProfile();
  if (state.profile?.role === "admin") {
    await loadUsers();
  }

  await loadInitialProjects();
  updateAuthState();
  render();
}

function bindEvents() {
  elements.authForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    await signIn();
  });

  elements.createUserForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    await createUserFromAdmin();
  });

  elements.goProjectsBtn?.addEventListener("click", () => {
    state.view = "registry";
    render();
  });
  elements.goUsersBtn?.addEventListener("click", () => {
    if (state.profile?.role !== "admin") {
      return;
    }
    state.view = "users";
    render();
  });
  elements.backToCabinetFromProjectsBtn?.addEventListener("click", () => {
    state.view = "cabinet";
    state.deleteMode = false;
    state.selectedIds.clear();
    render();
  });
  elements.backToCabinetFromUsersBtn?.addEventListener("click", () => {
    state.view = "cabinet";
    render();
  });
  elements.userSearchInput?.addEventListener("input", renderUsers);
  elements.headerMenuBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    elements.headerMenu.hidden = !elements.headerMenu.hidden;
  });
  document.addEventListener("click", (event) => {
    if (!elements.headerMenu || elements.headerMenu.hidden) {
      return;
    }
    if (!elements.headerMenu.contains(event.target) && !elements.headerMenuBtn?.contains(event.target)) {
      elements.headerMenu.hidden = true;
    }
  });

  elements.signOutBtn?.addEventListener("click", signOut);

  elements.newProjectBtn.addEventListener("click", () => {
    const project = createProject();
    state.projects.unshift(project);
    state.activeId = project.id;
    state.view = "detail";
    state.deleteMode = false;
    state.selectedIds.clear();
    state.map.mode = "move";
    elements.search.value = "";
    saveLocalProjects();
    render();
    persistProject(project).catch((error) => {
      console.error(error);
      alert("Проект добавлен в таблицу, но пока не сохранился на сервер. Проверьте подключение API.");
    });
  });

  elements.search.addEventListener("input", renderProjectTable);

  elements.form.addEventListener("input", (event) => {
    if (event.target.matches("input, textarea, select")) {
      const project = updateActiveProjectFromForm();
      renderProjectTable();
      queueProjectSave(project);
    }
  });

  elements.form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const project = updateActiveProjectFromForm();
    if (!validateProject(project)) {
      return;
    }
    await persistProject(project);
    renderProjectTable();
  });

  elements.exportBtn?.addEventListener("click", exportProjects);

  elements.importInput?.addEventListener("change", async (event) => {
    await importProjects(event.target.files[0]);
    event.target.value = "";
  });

  elements.deleteBtn.addEventListener("click", () => deleteProjects([state.activeId]));
  elements.deleteSelectedBtn.addEventListener("click", () => {
    if (state.selectedIds.size === 0) {
      alert("Выберите один или несколько проектов.");
      return;
    }

    deleteProjects([...state.selectedIds]);
  });
  elements.cancelDeleteBtn?.addEventListener("click", () => {
    state.deleteMode = false;
    state.selectedIds.clear();
    renderProjectTable();
  });
  elements.backToRegistryBtn.addEventListener("click", async () => {
    if (state.activeId) {
      await persistProject(updateActiveProjectFromForm());
    }

    state.view = "registry";
    render();
  });
  elements.saveProjectBtn.addEventListener("click", async () => {
    const project = updateActiveProjectFromForm();
    if (!validateProject(project)) {
      return;
    }
    await persistProject(project);
    render();
  });

  elements.statusPickerBtn.addEventListener("click", () => {
    renderStatusDropdown();
    elements.statusDropdown.hidden = !elements.statusDropdown.hidden;
  });

  elements.closeParamModalBtn.addEventListener("click", () => {
    closeParamModal();
  });
}

async function signIn() {
  const login = elements.authEmail.value.trim();
  const password = elements.authPassword.value;

  if (login === "123" && password === "123") {
    activateTestAdmin();
    state.view = "cabinet";
    await loadInitialProjects();
    updateAuthState();
    render();
    return;
  }

  if (!isApiConfigured) {
    alert("API еще не настроен. Вставьте адрес backend в api-config.js.");
    return;
  }

  try {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: {
        email: login,
        password,
      },
    });

    state.apiToken = data.token;
    localStorage.setItem(API_TOKEN_KEY, data.token);
    state.user = data.user;
    state.profile = data.user;
    state.serverMode = true;
    state.view = "cabinet";
    await loadUsers();
    await loadInitialProjects();
    updateAuthState();
    render();
  } catch (error) {
    alert(error.message);
  }
}

async function signUp() {
  alert("Создание пользователей выполняет администратор через backend API.");
}

function activateTestAdmin() {
  const admin = {
    id: "test-admin",
    email: "123",
    full_name: "Тестовый админ",
    role: "admin",
    is_active: true,
  };

  state.apiToken = "";
  state.user = admin;
  state.profile = admin;
  state.serverMode = false;
  state.users = [admin];
}

async function signOut() {
  state.apiToken = "";
  state.user = null;
  state.profile = null;
  state.serverMode = false;
  state.users = [];
  state.view = "cabinet";
  localStorage.removeItem(API_TOKEN_KEY);
  await loadInitialProjects();
  updateAuthState();
  render();
}

function setAuthTab(tab) {
  const isRegister = tab === "register";

  if (elements.authForm) {
    elements.authForm.hidden = isRegister;
  }
  if (elements.registerForm) {
    elements.registerForm.hidden = !isRegister;
  }
  if (elements.authTitle) {
    elements.authTitle.textContent = isRegister ? "Регистрация" : "Авторизация";
  }
  elements.showLoginBtn?.classList.toggle("is-active", !isRegister);
  elements.showRegisterBtn?.classList.toggle("is-active", isRegister);
}

async function registerUser() {
  if (!isApiConfigured) {
    alert("API еще не настроен. Вставьте адрес backend в api-config.js.");
    return;
  }

  try {
    const data = await apiRequest("/auth/register", {
      method: "POST",
      body: {
        fullName: elements.registerFullName.value.trim(),
        email: elements.registerEmail.value.trim(),
        password: elements.registerPassword.value,
      },
    });

    state.apiToken = data.token;
    localStorage.setItem(API_TOKEN_KEY, data.token);
    state.user = data.user;
    state.profile = data.user;
    state.serverMode = true;
    state.users = [];
    elements.registerForm.reset();
    await loadInitialProjects();
    updateAuthState();
    render();
  } catch (error) {
    alert(error.message);
  }
}

async function loadCurrentUserProfile() {
  state.profile = null;

  if (!isApiConfigured || !state.apiToken) {
    return;
  }

  try {
    const data = await apiRequest("/auth/me");
    state.user = data.user;
    state.profile = data.user;
    state.serverMode = true;
  } catch (error) {
    console.error(error);
    state.apiToken = "";
    state.user = null;
    state.profile = null;
    state.serverMode = false;
    localStorage.removeItem(API_TOKEN_KEY);
  }
}

async function loadUsers() {
  if (!isApiConfigured || state.profile?.role !== "admin") {
    state.users = [];
    return;
  }

  try {
    const data = await apiRequest("/users");
    state.users = data.users || [];
  } catch (error) {
    console.error(error);
    state.users = [];
  }
}

async function createUserFromAdmin() {
  if (state.profile?.role !== "admin") {
    return;
  }

  if (!state.serverMode) {
    state.users.unshift({
      id: createId(),
      email: elements.newUserEmail.value.trim(),
      full_name: elements.newUserFullName.value.trim(),
      role: elements.newUserRole.value,
      is_active: true,
    });
    elements.createUserForm.reset();
    renderUsers();
    return;
  }

  try {
    await apiRequest("/users", {
      method: "POST",
      body: {
        fullName: elements.newUserFullName.value.trim(),
        email: elements.newUserEmail.value.trim(),
        password: elements.newUserPassword.value,
        role: elements.newUserRole.value,
      },
    });

    elements.createUserForm.reset();
    await loadUsers();
    renderUsers();
  } catch (error) {
    alert(error.message);
  }
}

async function updateUserFromAdmin(userId, updates) {
  if (state.profile?.role !== "admin") {
    return;
  }

  if (!state.serverMode) {
    const user = state.users.find((item) => item.id === userId);
    if (user) {
      if (updates.role) {
        user.role = updates.role;
      }
      if (typeof updates.isActive === "boolean") {
        user.is_active = updates.isActive;
      }
    }
    renderUsers();
    return;
  }

  try {
    await apiRequest(`/users/${userId}`, {
      method: "PATCH",
      body: updates,
    });
    await loadUsers();
    renderUsers();
  } catch (error) {
    alert(error.message);
  }
}

function canDeleteProjects() {
  return !state.serverMode || state.profile?.role === "admin";
}

function updateAuthState() {
  if (!isApiConfigured) {
    if (elements.serverStatus) {
      elements.serverStatus.textContent = "Локальный режим: API не настроен, данные видны только в этом браузере.";
    }
    if (elements.signOutBtn) {
      elements.signOutBtn.hidden = true;
    }
    if (elements.appServerStatus) {
      elements.appServerStatus.textContent = "API не настроен.";
    }
    return;
  }

  if (state.user) {
    if (elements.serverStatus) {
      const role = state.profile?.role === "admin" ? "admin" : "user";
      elements.serverStatus.textContent = `Серверный режим: вход выполнен как ${state.user.email}. Роль: ${role}.`;
    }
    if (elements.signOutBtn) {
      elements.signOutBtn.hidden = false;
    }
    if (elements.appServerStatus) {
      const role = state.profile?.role === "admin" ? "admin" : "user";
      elements.appServerStatus.textContent = `Вход выполнен: ${state.user.email}. Роль: ${role}.`;
    }
    if (elements.authEmail) {
      elements.authEmail.value = state.user.email || "";
    }
    return;
  }

  if (elements.serverStatus) {
    elements.serverStatus.textContent = "API настроен. Войдите, чтобы работать с серверной базой и файлами.";
  }
  if (elements.signOutBtn) {
    elements.signOutBtn.hidden = true;
  }
  if (elements.appServerStatus) {
    elements.appServerStatus.textContent = "";
  }
}

function updateHeaderAccount() {
  if (!elements.headerUserName || !elements.headerUserLogin || !elements.headerUserRole) {
    return;
  }

  if (!state.user) {
    elements.headerUserName.textContent = "-";
    elements.headerUserLogin.textContent = "Логин: -";
    elements.headerUserRole.textContent = "Роль: -";
    return;
  }

  const role = state.profile?.role === "admin" ? "admin" : "user";
  const name = state.user.full_name || state.user.fullName || state.user.email || "Пользователь";
  const login = state.user.email || "без email";

  elements.headerUserName.textContent = name;
  elements.headerUserLogin.textContent = `Логин: ${login}`;
  elements.headerUserRole.textContent = `Роль: ${role}`;
}

async function loadInitialProjects() {
  state.projects = state.serverMode ? await loadServerProjects() : loadLocalProjects();
  state.activeId = state.projects[0]?.id || null;
}

async function loadServerProjects() {
  try {
    const data = await apiRequest("/projects");
    const projects = data.projects || [];
    const filesByProject = await Promise.all(
      projects.map(async (project) => {
        const filesData = await apiRequest(`/projects/${project.id}/files`);
        return [project.id, filesData.files || []];
      }),
    );
    const fileMap = new Map(filesByProject);

    return projects.map((project) => fromApiProject(project, fileMap.get(project.id) || []));
  } catch (error) {
    alert(`Не удалось загрузить проекты с сервера: ${error.message}`);
    return [];
  }
}

function render() {
  const isAuthenticated = Boolean(state.user);

  if (elements.authView) {
    elements.authView.hidden = isAuthenticated;
  }
  if (elements.appShell) {
    elements.appShell.hidden = !isAuthenticated;
  }

  if (!isAuthenticated) {
    return;
  }

  updateHeaderAccount();

  if (state.view === "users" && state.profile?.role !== "admin") {
    state.view = "cabinet";
  }

  if (elements.cabinetPanel) {
    elements.cabinetPanel.hidden = state.view !== "cabinet";
  }
  if (elements.userAdminPanel) {
    elements.userAdminPanel.hidden = state.view !== "users" || state.profile?.role !== "admin";
  }
  elements.registryView.hidden = state.view !== "registry";
  elements.detailView.hidden = state.view !== "detail";
  elements.deleteBtn.hidden = !canDeleteProjects();
  renderCabinet();
  renderUsers();
  renderProjectTable();

  if (state.view === "detail") {
    renderForm();
  }
}

function renderCabinet() {
  if (!elements.cabinetPanel || !state.user) {
    return;
  }

  const role = state.profile?.role === "admin" ? "admin" : "user";
  const displayName = state.user.full_name || state.user.fullName || "";

  if (elements.cabinetTitle) {
    elements.cabinetTitle.textContent = role === "admin" ? "Кабинет администратора" : "Кабинет пользователя";
  }
  if (elements.cabinetRole) {
    elements.cabinetRole.textContent = role;
    elements.cabinetRole.classList.toggle("is-admin", role === "admin");
  }
  if (elements.cabinetUserEmail) {
    elements.cabinetUserEmail.textContent = state.user.email || "Без email";
  }
  if (elements.cabinetUserName) {
    elements.cabinetUserName.textContent = displayName || "Имя не указано";
  }
  if (elements.cabinetProjects) {
    elements.cabinetProjects.textContent = String(state.projects.length);
  }
  if (elements.cabinetUsers) {
    elements.cabinetUsers.textContent = String(state.users.length);
  }
  if (elements.cabinetUsersCard) {
    elements.cabinetUsersCard.hidden = role !== "admin";
  }
  if (elements.goUsersBtn) {
    elements.goUsersBtn.hidden = role !== "admin";
  }
}

function renderUsersLegacy() {
  if (!elements.userList || state.profile?.role !== "admin") {
    return;
  }

  if (state.users.length === 0) {
    elements.userList.innerHTML = `<div class="user-empty">Пользователей пока нет</div>`;
    return;
  }

  elements.userList.innerHTML = "";
  state.users.forEach((user) => {
    const row = document.createElement("div");
    row.className = "user-row";
    row.innerHTML = `
      <div class="user-meta">
        <strong>${escapeHtml(user.full_name || user.email)}</strong>
        <span>${escapeHtml(user.email)}</span>
      </div>
      <select class="user-role-select" aria-label="Роль пользователя">
        <option value="user" ${user.role === "user" ? "selected" : ""}>user</option>
        <option value="admin" ${user.role === "admin" ? "selected" : ""}>admin</option>
      </select>
      <label class="user-active-toggle">
        <input class="user-active-checkbox" type="checkbox" ${user.is_active ? "checked" : ""} />
        Активен
      </label>
      <button class="secondary-button user-save-btn" type="button">Сохранить</button>
    `;

    row.querySelector(".user-save-btn").addEventListener("click", async () => {
      await updateUserFromAdmin(user.id, {
        role: row.querySelector(".user-role-select").value,
        isActive: row.querySelector(".user-active-checkbox").checked,
      });
    });
    elements.userList.append(row);
  });
}

function renderUsers() {
  if (!elements.userList || state.profile?.role !== "admin") {
    return;
  }

  const query = elements.userSearchInput?.value.trim().toLowerCase() || "";
  const users = state.users.filter((user) => {
    const content = [user.full_name, user.email, user.role].join(" ").toLowerCase();
    return content.includes(query);
  });

  if (users.length === 0) {
    elements.userList.innerHTML = `<tr><td class="user-empty" colspan="5">Пользователей пока нет</td></tr>`;
    return;
  }

  elements.userList.innerHTML = "";
  users.forEach((user) => {
    const row = document.createElement("tr");
    row.className = "user-row";
    row.innerHTML = `
      <td>
        <div class="user-meta">
          <strong>${escapeHtml(user.full_name || user.email)}</strong>
          <span>${user.id === state.user.id ? "Текущий аккаунт" : "Пользователь"}</span>
        </div>
      </td>
      <td>${escapeHtml(user.email)}</td>
      <td>
        <select class="user-role-select" aria-label="Роль пользователя">
          <option value="user" ${user.role === "user" ? "selected" : ""}>user</option>
          <option value="admin" ${user.role === "admin" ? "selected" : ""}>admin</option>
        </select>
      </td>
      <td>
        <label class="user-active-toggle">
          <input class="user-active-checkbox" type="checkbox" ${user.is_active ? "checked" : ""} />
          <span>${user.is_active ? "Активен" : "Отключен"}</span>
        </label>
      </td>
      <td>
        <button class="secondary-button user-save-btn" type="button">Сохранить</button>
      </td>
    `;

    row.querySelector(".user-save-btn").addEventListener("click", async () => {
      await updateUserFromAdmin(user.id, {
        role: row.querySelector(".user-role-select").value,
        isActive: row.querySelector(".user-active-checkbox").checked,
      });
    });
    elements.userList.append(row);
  });
}

function renderProjectTable() {
  const query = elements.search.value.trim().toLowerCase();
  const canDelete = canDeleteProjects();
  const filteredProjects = state.projects.filter((project) => {
    const content = [project.title, project.address, project.status, project.responsible, project.area].join(" ").toLowerCase();
    return content.includes(query);
  });

  elements.tableBody.innerHTML = "";
  elements.projectTable?.classList.remove("is-delete-mode");
  elements.deleteSelectedBtn.textContent = "Удалить выбранные";
  elements.deleteSelectedBtn.hidden = !canDelete;
  if (elements.cancelDeleteBtn) {
    elements.cancelDeleteBtn.hidden = true;
  }

  if (filteredProjects.length === 0) {
    elements.tableBody.innerHTML = `<tr class="empty-row"><td colspan="8">Проектов пока нет</td></tr>`;
    return;
  }

  filteredProjects.forEach((project) => {
    const row = document.createElement("tr");
    row.className = [
      project.id === state.activeId ? "is-active" : "",
      state.selectedIds.has(project.id) ? "is-selected" : "",
    ].filter(Boolean).join(" ");
    row.innerHTML = `
      <td class="select-col"><input class="project-select" type="checkbox" ${state.selectedIds.has(project.id) ? "checked" : ""} aria-label="Выбрать проект" /></td>
      <td>${escapeHtml(project.title || "Без названия")}</td>
      <td>${escapeHtml(project.address || "Не заполнено")}</td>
      <td><span class="status-pill">${escapeHtml(project.status || "Не заполнено")}</span></td>
      <td>${formatDate(project.createdAt)}</td>
      <td>${escapeHtml(project.responsible || "Не заполнено")}</td>
      <td>${escapeHtml(project.area || "Не заполнено")}</td>
      <td><button class="secondary-button table-open-button" type="button">Открыть</button></td>
    `;
    row.querySelector(".project-select").addEventListener("click", (event) => {
      event.stopPropagation();

      if (event.target.checked) {
        state.selectedIds.add(project.id);
      } else {
        state.selectedIds.delete(project.id);
      }
      renderProjectTable();
    });
    row.querySelector(".table-open-button").addEventListener("click", (event) => {
      event.stopPropagation();
      openProject(project.id);
    });
    elements.tableBody.append(row);
  });
}

function openProject(projectId) {
  state.activeId = projectId;
  state.view = "detail";
  state.map.mode = "move";
  render();
}

function renderForm() {
  const project = getActiveProject();

  fields.forEach((field) => {
    const input = document.querySelector(`#${field}`);
    input.value = project[field] || "";
  });
  elements.statusPickerText.textContent = project.status || "Выбрать статус";

  renderSections(project);
}

function renderSections(project) {
  const sectionList = document.querySelector("#sectionList");
  const sections = getProjectSections(project);

  sectionList.innerHTML = "";

  sections.forEach((section, sectionIndex) => {
    const chapter = document.createElement("section");
    chapter.className = "chapter";
    chapter.innerHTML = `
      <div class="chapter-heading">
        <h3>${escapeHtml(section.title)}</h3>
        <p>${escapeHtml(section.subtitle || "")}</p>
      </div>
      <div class="param-table-wrap">
        <table class="param-table">
          <tbody>
            ${section.items
              .map((item, itemIndex) => renderParamRow(project, item, sectionIndex, itemIndex))
              .join("")}
          </tbody>
        </table>
      </div>
    `;
    sectionList.append(chapter);
  });

  sectionList.querySelectorAll("[data-param-input]").forEach((input) => {
    input.addEventListener("input", () => {
      const activeProject = getActiveProject();
      const sectionIndex = Number(input.dataset.sectionIndex);
      const itemIndex = Number(input.dataset.itemIndex);
      const item = activeProject.sections[sectionIndex].items[itemIndex];
      const valueKey = input.dataset.valueKey || "value";

      item[valueKey] = input.value;
      input.closest("tr").classList.toggle("is-filled", isParamFilled(activeProject, item));
      queueProjectSave(activeProject);
    });
  });

  sectionList.querySelectorAll("[data-param-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const activeProject = getActiveProject();
      const sectionIndex = Number(button.dataset.sectionIndex);
      const itemIndex = Number(button.dataset.itemIndex);
      const item = activeProject.sections[sectionIndex].items[itemIndex];

      if (item.type === "map") {
        openMapModal(item);
      } else if (item.type === "images") {
        openImagesModal(item);
      } else if (item.type === "documents") {
        openDocumentsModal(item);
      }
    });
  });

  sectionList.querySelectorAll("[data-calendar-button]").forEach((button) => {
    button.addEventListener("click", () => {
      const activeProject = getActiveProject();
      const sectionIndex = Number(button.dataset.sectionIndex);
      const itemIndex = Number(button.dataset.itemIndex);
      const item = activeProject.sections[sectionIndex].items[itemIndex];

      item.calendarOpen = !item.calendarOpen;
      renderSections(activeProject);
    });
  });

  sectionList.querySelectorAll("[data-calendar-month], [data-calendar-year]").forEach((select) => {
    select.addEventListener("change", () => {
      const activeProject = getActiveProject();
      const sectionIndex = Number(select.dataset.sectionIndex);
      const itemIndex = Number(select.dataset.itemIndex);
      const item = activeProject.sections[sectionIndex].items[itemIndex];
      const row = select.closest(".inline-calendar");

      item.calendarMonth = Number(row.querySelector("[data-calendar-month]").value);
      item.calendarYear = Number(row.querySelector("[data-calendar-year]").value);
      renderSections(activeProject);
    });
  });

  sectionList.querySelectorAll("[data-calendar-day]").forEach((button) => {
    button.addEventListener("click", () => {
      const activeProject = getActiveProject();
      const sectionIndex = Number(button.dataset.sectionIndex);
      const itemIndex = Number(button.dataset.itemIndex);
      const item = activeProject.sections[sectionIndex].items[itemIndex];
      const selected = parseIsoDate(button.dataset.calendarDay);

      item.date = button.dataset.calendarDay;
      item.calendarMonth = selected.getMonth();
      item.calendarYear = selected.getFullYear();
      item.calendarOpen = false;
      queueProjectSave(activeProject);
      renderSections(activeProject);
    });
  });

  bindInlineMap(project);
}

function renderParamRow(project, item, sectionIndex, itemIndex) {
  const filled = isParamFilled(project, item);
  const badges = `
    ${item.required ? `<span class="required-mark" title="Обязательное поле">*</span>` : ""}
    ${item.optional ? `<span class="mini-badge opt">опц.</span>` : ""}
  `;

  if (item.type === "deadline") {
    return `
      <tr class="${filled ? "is-filled" : ""}">
        <td>
          <div class="param-name-cell">
            <strong>${escapeHtml(item.label)} ${badges}</strong>
            <span>${escapeHtml(item.note || "")}</span>
          </div>
        </td>
        <td>
          <div class="deadline-fields">
            <div class="deadline-picker">
              <div class="deadline-date-control">
                <input class="deadline-date-input" type="text" readonly placeholder="Выберите дату" value="${escapeHtml(formatDeadlineInputDate(item.date))}" />
                <button class="deadline-calendar-button" data-calendar-button data-section-index="${sectionIndex}" data-item-index="${itemIndex}" type="button" aria-label="Открыть календарь">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="4" y="5" width="16" height="15" rx="2"></rect>
                    <path d="M8 3v4M16 3v4M4 10h16"></path>
                  </svg>
                </button>
              </div>
              ${item.calendarOpen ? renderInlineCalendar(item, sectionIndex, itemIndex) : ""}
            </div>
            <label>
              <textarea aria-label="Комментарии" data-param-input data-value-key="comment" data-section-index="${sectionIndex}" data-item-index="${itemIndex}" rows="2" placeholder="Комментарии">${escapeHtml(item.comment || "")}</textarea>
            </label>
          </div>
        </td>
      </tr>
    `;
  }

  if (item.type === "map") {
    return `
      <tr class="${filled ? "is-filled" : ""}">
        <td>
          <div class="param-name-cell">
            <strong>${escapeHtml(item.label)} ${badges}</strong>
            <span>${escapeHtml(item.note || "")}</span>
          </div>
        </td>
        <td>
          <div class="inline-map-panel">
            <div class="map-frame inline-map-frame" data-inline-map-frame></div>
            <div class="map-actions">
              <button class="secondary-button" data-inline-map-action="draw" type="button">Границы территории</button>
              <button class="secondary-button danger" data-inline-map-action="clear" type="button">Очистить</button>
              <button class="primary-button" data-inline-map-action="save" type="button">Сохранить территорию</button>
            </div>
            <div class="map-area-summary">Площадь выделенной территории: ${escapeHtml(project.area || "не указана")}</div>
          </div>
        </td>
      </tr>
    `;
  }

  if (item.type === "images" || item.type === "documents") {
    const files = getItemFiles(project, item);
    return `
      <tr class="${filled ? "is-filled" : ""}">
        <td>
          <div class="param-name-cell">
            <strong>${escapeHtml(item.label)} ${badges}</strong>
            <span>${escapeHtml(item.note || "")}</span>
          </div>
        </td>
        <td>
          <div class="param-file-control">
            <button class="secondary-button param-action-button" data-param-action="${item.type}" data-section-index="${sectionIndex}" data-item-index="${itemIndex}" type="button">
              ${escapeHtml(getParamActionText(project, item))}
            </button>
            ${renderInlineFileList(files, item.type)}
          </div>
          <textarea class="param-file-comment" data-param-input data-section-index="${sectionIndex}" data-item-index="${itemIndex}" rows="2" placeholder="Комментарий к ${item.type === "documents" ? "документам" : "материалам"}">${escapeHtml(item.value || "")}</textarea>
        </td>
      </tr>
    `;
  }

  return `
    <tr class="${filled ? "is-filled" : ""}">
      <td>
        <div class="param-name-cell">
          <strong>${escapeHtml(item.label)} ${badges}</strong>
          <span>${escapeHtml(item.note || "")}</span>
        </div>
      </td>
      <td>
        <textarea data-param-input data-section-index="${sectionIndex}" data-item-index="${itemIndex}" rows="2" placeholder="Заполните данные">${escapeHtml(item.value || "")}</textarea>
      </td>
    </tr>
  `;
}

function renderInlineCalendar(item, sectionIndex, itemIndex) {
  const selected = parseIsoDate(item.date);
  const today = new Date();
  const viewYear = Number(item.calendarYear) || selected?.getFullYear() || today.getFullYear();
  const viewMonth = Number.isInteger(Number(item.calendarMonth)) ? Number(item.calendarMonth) : selected?.getMonth() ?? today.getMonth();
  const monthNames = [
    "Январь",
    "Февраль",
    "Март",
    "Апрель",
    "Май",
    "Июнь",
    "Июль",
    "Август",
    "Сентябрь",
    "Октябрь",
    "Ноябрь",
    "Декабрь",
  ];
  const yearOptions = Array.from({ length: 21 }, (_, index) => today.getFullYear() - 5 + index)
    .map((year) => `<option value="${year}" ${year === viewYear ? "selected" : ""}>${year}</option>`)
    .join("");
  const firstDay = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const leadingEmpty = (firstDay.getDay() + 6) % 7;
  const cells = [];

  for (let index = 0; index < leadingEmpty; index += 1) {
    cells.push(`<span class="calendar-day is-empty"></span>`);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateValue = toIsoDate(viewYear, viewMonth, day);
    const isSelected = item.date === dateValue;
    cells.push(`
      <button class="calendar-day${isSelected ? " is-selected" : ""}" data-calendar-day="${dateValue}" data-section-index="${sectionIndex}" data-item-index="${itemIndex}" type="button">
        ${day}
      </button>
    `);
  }

  return `
    <div class="inline-calendar">
      <div class="calendar-toolbar">
        <select data-calendar-month data-section-index="${sectionIndex}" data-item-index="${itemIndex}">
          ${monthNames.map((month, index) => `<option value="${index}" ${index === viewMonth ? "selected" : ""}>${month}</option>`).join("")}
        </select>
        <select data-calendar-year data-section-index="${sectionIndex}" data-item-index="${itemIndex}">
          ${yearOptions}
        </select>
      </div>
      <div class="calendar-weekdays">
        <span>Пн</span><span>Вт</span><span>Ср</span><span>Чт</span><span>Пт</span><span>Сб</span><span>Вс</span>
      </div>
      <div class="calendar-grid">${cells.join("")}</div>
      <div class="calendar-selected-card">
        <span>Выбранный срок</span>
        <strong>${escapeHtml(formatDeadlineDate(item.date))}</strong>
      </div>
    </div>
  `;
}

function parseIsoDate(value) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function toIsoDate(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatDeadlineDate(value) {
  const date = parseIsoDate(value);

  if (!date) {
    return "не выбран";
  }

  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatDeadlineInputDate(value) {
  const date = parseIsoDate(value);
  return date ? date.toLocaleDateString("ru-RU") : "";
}

function getParamActionText(project, item) {
  if (item.type === "map") {
    return (project.areaPoints || []).length > 0 ? "Границы указаны" : "Карта";
  }

  if (item.type === "images") {
    const count = getItemFiles(project, item).length;
    return count > 0 ? `Добавить материал (${count})` : "Добавить материал";
  }

  if (item.type === "documents") {
    const count = getItemFiles(project, item).length;
    return count > 0 ? `Добавить документы (${count})` : "Добавить документы";
  }

  return "Открыть";
}

function getItemFiles(project, item) {
  const source = item.type === "images" ? project.images || [] : project.documents || [];

  return source.filter((file) => {
    if (file.category) {
      return file.category === item.label;
    }

    return item.label === "Документы и файлы" || item.label === "Фото участка";
  });
}

function renderInlineFileList(files, type) {
  if (files.length === 0) {
    return `<div class="inline-file-list is-empty">Пока ничего не добавлено</div>`;
  }

  if (type === "documents") {
    return `
      <div class="document-preview-grid">
        ${files.map((file) => renderDocumentPreview(file)).join("")}
      </div>
    `;
  }

  return `
    <div class="inline-file-list">
      ${files
        .map(
          (file) => `
            <a href="${getFileUrl(file)}" target="_blank" rel="noreferrer" download="${escapeHtml(file.name)}">
              ${escapeHtml(file.name)}
            </a>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderDocumentPreview(file) {
  const fileUrl = getFileUrl(file);
  const canPreview = file.type?.startsWith("image/") || file.type === "application/pdf";

  return `
    <div class="document-preview">
      <div class="document-preview-frame">
        ${
          canPreview
            ? `<iframe src="${fileUrl}" title="${escapeHtml(file.name)}"></iframe>`
            : `<a href="${fileUrl}" target="_blank" rel="noreferrer">Открыть документ</a>`
        }
      </div>
      <a class="document-preview-name" href="${fileUrl}" target="_blank" rel="noreferrer" download="${escapeHtml(file.name)}">${escapeHtml(file.name)}</a>
    </div>
  `;
}

function isParamFilled(project, item) {
  if (item.type === "map") {
    return (project.areaPoints || []).length > 0 || Boolean(project.lat && project.lng);
  }

  if (item.type === "images") {
    return getItemFiles(project, item).length > 0 || Boolean(item.value);
  }

  if (item.type === "documents") {
    return getItemFiles(project, item).length > 0 || Boolean(item.value);
  }

  if (item.type === "deadline") {
    return Boolean(item.date || item.comment);
  }

  return Boolean(item.value);
}

function validateProject(project) {
  const missing = [];

  getProjectSections(project).forEach((section) => {
    section.items.forEach((item) => {
      if (item.required && !isParamFilled(project, item)) {
        missing.push(`${section.title}: ${item.label}`);
      }
    });
  });

  if (missing.length === 0) {
    return true;
  }

  alert(`Заполните обязательные пункты:\n\n${missing.slice(0, 12).join("\n")}${missing.length > 12 ? "\n..." : ""}`);
  return false;
}

function openParamEditor(card) {
  const activeProject = getActiveProject();
  const sectionIndex = Number(card.dataset.sectionIndex);
  const itemIndex = Number(card.dataset.itemIndex);
  const item = activeProject.sections[sectionIndex].items[itemIndex];

  if (item.type === "map") {
    openMapModal(item);
    return;
  }

  if (item.type === "images") {
    openImagesModal(item);
    return;
  }

  if (item.type === "documents") {
    openDocumentsModal(item);
    return;
  }

  elements.paramModalEyebrow.textContent = "Параметр участка";
  elements.paramModalTitle.textContent = item.label;
  elements.paramModalNote.textContent = item.note || "";
  elements.paramModalBody.innerHTML = `
    <div class="param-modal-editor">
      <textarea rows="10" placeholder="Заполните вручную">${escapeHtml(item.value || "")}</textarea>
    </div>
  `;

  const textarea = elements.paramModalBody.querySelector("textarea");
  textarea.addEventListener("input", () => {
    item.value = textarea.value;
    card.classList.toggle("is-filled", Boolean(item.value.trim()));
    queueProjectSave(activeProject);
  });
  openParamModal();
  textarea.focus();
}

function openMapModal(item) {
  elements.paramModalEyebrow.textContent = "Карта и территория";
  elements.paramModalTitle.textContent = item.label;
  elements.paramModalNote.textContent = item.note || "";
  elements.paramModalBody.innerHTML = elements.mapModalTemplate.innerHTML;
  openParamModal();
  refreshDynamicElements();
  bindMapModalControls();
  renderMap(getActiveProject());
}

function openImagesModal(item) {
  state.currentFileItem = item;
  elements.paramModalEyebrow.textContent = "Визуальные материалы";
  elements.paramModalTitle.textContent = item.label;
  elements.paramModalNote.textContent = item.note || "";
  elements.paramModalBody.innerHTML = elements.imagesModalTemplate.innerHTML;
  openParamModal();
  refreshDynamicElements();
  elements.imageInput.addEventListener("change", async (event) => {
    await addFiles(event.target.files, "image");
    event.target.value = "";
  });
  renderImages(getActiveProject());
}

function openDocumentsModal(item) {
  state.currentFileItem = item;
  elements.paramModalEyebrow.textContent = "Документы";
  elements.paramModalTitle.textContent = item.label;
  elements.paramModalNote.textContent = item.note || "";
  elements.paramModalBody.innerHTML = elements.documentsModalTemplate.innerHTML;
  openParamModal();
  refreshDynamicElements();
  elements.documentInput.addEventListener("change", async (event) => {
    await addFiles(event.target.files, "document");
    event.target.value = "";
  });
  renderDocuments(getActiveProject());
}

function openParamModal() {
  elements.paramModal.hidden = false;
}

function closeParamModal() {
  elements.paramModal.hidden = true;
  elements.paramModalBody.innerHTML = "";
  state.map.mode = "move";
  state.currentFileItem = null;
}

function refreshDynamicElements() {
  elements.mapFrame = document.querySelector("#mapFrame");
  elements.imageInput = document.querySelector("#imageInput");
  elements.documentInput = document.querySelector("#documentInput");
  elements.imageGrid = document.querySelector("#imageGrid");
  elements.documentList = document.querySelector("#documentList");
  elements.drawAreaBtn = document.querySelector("#drawAreaBtn");
  elements.clearAreaBtn = document.querySelector("#clearAreaBtn");
  elements.saveMapBtn = document.querySelector("#saveMapBtn");
}

function bindInlineMap(project) {
  const inlineMapFrame = document.querySelector("[data-inline-map-frame]");

  if (!inlineMapFrame) {
    return;
  }

  elements.mapFrame = inlineMapFrame;
  renderMap(project);

  document.querySelector("[data-inline-map-action='draw']")?.addEventListener("click", () => {
    state.map.mode = state.map.mode === "draw" ? "move" : "draw";
    elements.mapFrame = inlineMapFrame;
    renderMap(getActiveProject());
    updateInlineMapActionState();
  });

  document.querySelector("[data-inline-map-action='clear']")?.addEventListener("click", async () => {
    const activeProject = getActiveProject();
    activeProject.areaPoints = [];
    activeProject.areaSquareMeters = 0;
    activeProject.area = "";
    activeProject.lat = "";
    activeProject.lng = "";
    activeProject.updatedAt = new Date().toISOString();
    setAreaInputValue("");
    elements.mapFrame = inlineMapFrame;
    await persistProject(activeProject);
    renderMap(activeProject);
    renderProjectTable();
    renderSections(activeProject);
  });

  document.querySelector("[data-inline-map-action='save']")?.addEventListener("click", async () => {
    const activeProject = updateActiveProjectFromForm();
    state.map.mode = "move";
    elements.mapFrame = inlineMapFrame;
    await persistProject(activeProject);
    renderMap(activeProject);
    renderProjectTable();
    updateInlineMapActionState();
  });

  updateInlineMapActionState();
}

function updateInlineMapActionState() {
  document.querySelector("[data-inline-map-action='draw']")?.classList.toggle("is-active", state.map.mode === "draw");
}

function bindMapModalControls() {
  elements.drawAreaBtn.addEventListener("click", () => {
    state.map.mode = state.map.mode === "draw" ? "move" : "draw";
    renderMap(getActiveProject());
  });

  elements.clearAreaBtn.addEventListener("click", async () => {
    const project = getActiveProject();
    project.areaPoints = [];
    project.areaSquareMeters = 0;
    project.area = "";
    project.lat = "";
    project.lng = "";
    project.updatedAt = new Date().toISOString();
    setAreaInputValue("");
    await persistProject(project);
    renderMap(project);
    renderProjectTable();
  });

  elements.saveMapBtn.addEventListener("click", async () => {
    const project = updateActiveProjectFromForm();
    state.map.mode = "move";
    await persistProject(project);
    renderMap(project);
    renderProjectTable();
  });
}

function getProjectSections(project) {
  if (!Array.isArray(project.sections) || project.sections.length === 0) {
    project.sections = defaultSections.map((section) => ({
      title: section.title,
      subtitle: section.subtitle,
      items: section.items.map(([label, note, required, optional, type]) => ({
        label,
        note,
        required: Boolean(required),
        optional: Boolean(optional),
        type: type || "text",
        value: "",
        date: "",
        comment: "",
        calendarMonth: "",
        calendarYear: "",
        calendarOpen: false,
      })),
    }));
  }

  project.sections = normalizeSections(project.sections);
  return project.sections;
}

function renderMap(project) {
  const savedLat = Number.parseFloat(project.lat);
  const savedLng = Number.parseFloat(project.lng);

  if (Number.isFinite(savedLat) && Number.isFinite(savedLng)) {
    state.map.centerLat = savedLat;
    state.map.centerLng = savedLng;
    state.map.zoom = Math.max(state.map.zoom, 12);
  } else if (project.areaPoints.length > 0) {
    state.map.centerLat = project.areaPoints[0].lat;
    state.map.centerLng = project.areaPoints[0].lng;
    state.map.zoom = Math.max(state.map.zoom, 12);
  }

  drawMap(project);
}

function drawMap(project) {
  const frame = elements.mapFrame;
  const width = frame.clientWidth || 800;
  const height = frame.clientHeight || 300;
  const zoom = state.map.zoom;
  const center = latLngToWorld(state.map.centerLat, state.map.centerLng, zoom);
  const startX = center.x - width / 2;
  const startY = center.y - height / 2;
  const minTileX = Math.floor(startX / 256);
  const maxTileX = Math.floor((startX + width) / 256);
  const minTileY = Math.floor(startY / 256);
  const maxTileY = Math.floor((startY + height) / 256);
  const tileCount = 2 ** zoom;

  frame.innerHTML = `
    <div class="map-tile-layer${state.map.mode !== "move" ? " is-drawing" : ""}" id="mapTileLayer"></div>
    <svg class="map-overlay" id="mapOverlay" aria-hidden="true"></svg>
    <div class="map-controls">
      <button type="button" id="zoomInBtn" aria-label="Приблизить">+</button>
      <button type="button" id="zoomOutBtn" aria-label="Отдалить">−</button>
    </div>
  `;

  const layer = frame.querySelector("#mapTileLayer");
  const overlay = frame.querySelector("#mapOverlay");

  for (let x = minTileX; x <= maxTileX; x += 1) {
    for (let y = minTileY; y <= maxTileY; y += 1) {
      if (y < 0 || y >= tileCount) {
        continue;
      }

      const wrappedX = ((x % tileCount) + tileCount) % tileCount;
      const image = document.createElement("img");
      image.className = "map-tile";
      image.alt = "";
      image.draggable = false;
      image.src = `https://tile.openstreetmap.org/${zoom}/${wrappedX}/${y}.png`;
      image.style.left = `${x * 256 - startX}px`;
      image.style.top = `${y * 256 - startY}px`;
      layer.append(image);
    }
  }

  drawAreaOverlay(project, overlay, startX, startY, zoom);
  drawMarker(project, frame, startX, startY, zoom);
  bindMapEvents(layer, startX, startY, zoom);
  bindZoomButtons();
  updateMapActionState();
  updateInlineMapAreaSummary(project);
}

function drawMarker(project, frame, startX, startY, zoom) {
  const lat = Number.parseFloat(project.lat);
  const lng = Number.parseFloat(project.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return;
  }

  const markerPoint = latLngToWorld(lat, lng, zoom);
  const marker = document.createElement("div");
  marker.className = "map-marker";
  marker.title = project.title || "Участок";
  marker.style.left = `${markerPoint.x - startX}px`;
  marker.style.top = `${markerPoint.y - startY}px`;
  frame.append(marker);
}

function bindMapEvents(layer, startX, startY, zoom) {
  layer.addEventListener("pointerdown", (event) => {
    layer.setPointerCapture(event.pointerId);
    state.map.dragStart = {
      x: event.clientX,
      y: event.clientY,
      centerLat: state.map.centerLat,
      centerLng: state.map.centerLng,
    };
    state.map.moved = false;
    layer.classList.add("is-dragging");
  });

  layer.addEventListener("pointermove", (event) => {
    if (!state.map.dragStart) {
      return;
    }

    const deltaX = event.clientX - state.map.dragStart.x;
    const deltaY = event.clientY - state.map.dragStart.y;

    if (Math.abs(deltaX) + Math.abs(deltaY) < 4) {
      return;
    }

    const startCenter = latLngToWorld(state.map.dragStart.centerLat, state.map.dragStart.centerLng, zoom);
    const nextCenter = worldToLatLng(startCenter.x - deltaX, startCenter.y - deltaY, zoom);

    state.map.centerLat = clamp(nextCenter.lat, -85, 85);
    state.map.centerLng = wrapLng(nextCenter.lng);
    state.map.moved = true;
    moveVisibleMap(deltaX, deltaY);
  });

  layer.addEventListener("pointerup", (event) => {
    if (state.map.dragStart && state.map.moved) {
      state.map.suppressClickUntil = Date.now() + 250;
      drawMap(getActiveProject());
    }

    state.map.dragStart = null;
    layer.classList.remove("is-dragging");

    try {
      layer.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer capture can already be released by the browser.
    }
  });

  layer.addEventListener("click", async (event) => {
    if (state.map.moved || Date.now() < state.map.suppressClickUntil || state.map.mode === "move") {
      state.map.moved = false;
      return;
    }

    const rect = layer.getBoundingClientRect();
    const point = {
      x: startX + event.clientX - rect.left,
      y: startY + event.clientY - rect.top,
    };
    const latLng = worldToLatLng(point.x, point.y, zoom);
    const activeProject = getActiveProject();

    if (state.map.mode !== "draw") {
      return;
    }

    activeProject.areaPoints = activeProject.areaPoints || [];
    activeProject.areaPoints.push({
      lat: Number(latLng.lat.toFixed(6)),
      lng: Number(latLng.lng.toFixed(6)),
    });
    updateCalculatedArea(activeProject);

    activeProject.updatedAt = new Date().toISOString();
    await persistProject(activeProject);
    drawMap(activeProject);
    renderProjectTable();
  });
}

function moveVisibleMap(deltaX, deltaY) {
  const frame = elements.mapFrame;
  const layer = frame.querySelector("#mapTileLayer");
  const overlay = frame.querySelector("#mapOverlay");
  const marker = frame.querySelector(".map-marker");

  if (layer) {
    layer.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
  }

  if (overlay) {
    overlay.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
  }

  if (marker) {
    marker.style.transform = `translate(${deltaX}px, ${deltaY}px) translate(-50%, -100%) rotate(-45deg)`;
  }
}

function bindZoomButtons() {
  document.querySelector("#zoomInBtn").addEventListener("click", () => {
    state.map.zoom = Math.min(state.map.zoom + 1, 18);
    drawMap(getActiveProject());
  });

  document.querySelector("#zoomOutBtn").addEventListener("click", () => {
    state.map.zoom = Math.max(state.map.zoom - 1, 3);
    drawMap(getActiveProject());
  });
}

function drawAreaOverlay(project, overlay, startX, startY, zoom) {
  const points = project.areaPoints || [];

  overlay.innerHTML = "";

  if (points.length === 0) {
    return;
  }

  const screenPoints = points.map((point) => {
    const worldPoint = latLngToWorld(point.lat, point.lng, zoom);
    return {
      x: worldPoint.x - startX,
      y: worldPoint.y - startY,
    };
  });
  const path = screenPoints.map((point) => `${point.x},${point.y}`).join(" ");
  const shape = document.createElementNS("http://www.w3.org/2000/svg", points.length >= 3 ? "polygon" : "polyline");

  shape.setAttribute("points", path);
  shape.setAttribute("class", points.length >= 3 ? "map-area-shape" : "map-area-line");
  overlay.append(shape);

  screenPoints.forEach((point) => {
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", point.x);
    circle.setAttribute("cy", point.y);
    circle.setAttribute("r", 5);
    circle.setAttribute("class", "map-area-point");
    overlay.append(circle);
  });
}

function updateCalculatedArea(project) {
  const points = project.areaPoints || [];

  if (points.length < 3) {
    project.areaSquareMeters = 0;
    project.area = "";
    setAreaInputValue("");
    return;
  }

  const squareMeters = calculatePolygonArea(points);
  project.areaSquareMeters = Math.round(squareMeters);
  project.area = formatArea(squareMeters);
  setProjectMarkerToAreaCenter(project);
  setAreaInputValue(project.area);
}

function setAreaInputValue(value) {
  const areaInput = document.querySelector("#area");

  if (areaInput) {
    areaInput.value = value;
  }
}

function setProjectMarkerToAreaCenter(project) {
  const points = project.areaPoints || [];

  if (points.length === 0) {
    return;
  }

  const center = calculatePolygonCenter(points);
  project.lat = center.lat.toFixed(6);
  project.lng = center.lng.toFixed(6);
}

function calculatePolygonCenter(points) {
  let areaFactor = 0;
  let centerLng = 0;
  let centerLat = 0;

  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length];
    const factor = point.lng * next.lat - next.lng * point.lat;
    areaFactor += factor;
    centerLng += (point.lng + next.lng) * factor;
    centerLat += (point.lat + next.lat) * factor;
  });

  if (Math.abs(areaFactor) < 0.0000001) {
    const fallback = points.reduce(
      (total, point) => ({
        lat: total.lat + point.lat,
        lng: total.lng + point.lng,
      }),
      { lat: 0, lng: 0 },
    );

    return {
      lat: fallback.lat / points.length,
      lng: fallback.lng / points.length,
    };
  }

  return {
    lat: centerLat / (3 * areaFactor),
    lng: centerLng / (3 * areaFactor),
  };
}

function updateMapActionState() {
  elements.drawAreaBtn?.classList.toggle("is-active", state.map.mode === "draw");
  updateInlineMapActionState();
}

function updateInlineMapAreaSummary(project) {
  const summary = document.querySelector(".map-area-summary");

  if (summary) {
    summary.textContent = `Площадь выделенной территории: ${project.area || "не указана"}`;
  }
}

function renderStatusDropdown() {
  const activeProject = getActiveProject();

  elements.statusDropdown.innerHTML = "";

  statusPhases.forEach((phase, phaseIndex) => {
    const phaseBlock = document.createElement("div");
    phaseBlock.className = `status-dropdown-phase phase-${phaseIndex + 1}`;
    phaseBlock.innerHTML = `
      <div class="status-dropdown-label">${escapeHtml(phase.phase)}</div>
      <div class="status-dropdown-options"></div>
    `;

    const list = phaseBlock.querySelector(".status-dropdown-options");

    phase.statuses.forEach((statusText) => {
      const option = document.createElement("button");
      option.className = `status-dropdown-option${activeProject.status === statusText ? " is-selected" : ""}`;
      option.type = "button";
      option.innerHTML = `
        <span class="status-check">${activeProject.status === statusText ? "✓" : ""}</span>
        <span class="status-body">
          <strong>${escapeHtml(statusText)}</strong>
        </span>
      `;
      option.addEventListener("click", async () => {
        activeProject.status = statusText;
        activeProject.statusName = statusText;
        activeProject.statusDescription = "";
        activeProject.statusBadge = statusText;
        activeProject.updatedAt = new Date().toISOString();
        document.querySelector("#status").value = statusText;
        elements.statusPickerText.textContent = statusText;
        elements.statusDropdown.hidden = true;
        await persistProject(activeProject);
        renderProjectTable();
      });
      list.append(option);
    });

    elements.statusDropdown.append(phaseBlock);
  });
}

function calculatePolygonArea(points) {
  const earthRadius = 6378137;
  const avgLat = points.reduce((sum, point) => sum + point.lat, 0) / points.length;
  const originLng = points[0].lng;
  const originLat = points[0].lat;
  const projectedPoints = points.map((point) => ({
    x: ((point.lng - originLng) * Math.PI * earthRadius * Math.cos((avgLat * Math.PI) / 180)) / 180,
    y: ((point.lat - originLat) * Math.PI * earthRadius) / 180,
  }));
  let sum = 0;

  projectedPoints.forEach((point, index) => {
    const next = projectedPoints[(index + 1) % projectedPoints.length];
    sum += point.x * next.y - next.x * point.y;
  });

  return Math.abs(sum / 2);
}

function latLngToWorld(lat, lng, zoom) {
  const sinLat = Math.sin((lat * Math.PI) / 180);
  const scale = 256 * 2 ** zoom;

  return {
    x: ((lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale,
  };
}

function worldToLatLng(x, y, zoom) {
  const scale = 256 * 2 ** zoom;
  const lng = (x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / scale;
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));

  return { lat, lng };
}

function renderImages(project) {
  elements.imageGrid.innerHTML = "";
  const images = state.currentFileItem ? getItemFiles(project, state.currentFileItem) : project.images;

  if (images.length === 0) {
    elements.imageGrid.innerHTML = `<div class="empty-state"><p>Фото пока не добавлены.</p></div>`;
    return;
  }

  images.forEach((image) => {
    const tile = document.createElement("div");
    tile.className = "image-tile";
    const isVideo = image.type?.startsWith("video/");
    tile.innerHTML = `
      ${
        isVideo
          ? `<video src="${getFileUrl(image)}" controls></video>`
          : `<img src="${getFileUrl(image)}" alt="${escapeHtml(image.name)}" />`
      }
      <button class="icon-button" type="button" aria-label="Удалить изображение">×</button>
    `;
    tile.querySelector("button").addEventListener("click", async () => {
      await deleteFile(project, image);
      renderImages(project);
    });
    elements.imageGrid.append(tile);
  });
}

function renderDocuments(project) {
  elements.documentList.innerHTML = "";
  const documents = state.currentFileItem ? getItemFiles(project, state.currentFileItem) : project.documents;

  if (documents.length === 0) {
    elements.documentList.innerHTML = `<div class="empty-state"><p>Файлы пока не добавлены.</p></div>`;
    return;
  }

  documents.forEach((documentItem) => {
    const row = document.createElement("div");
    row.className = "file-row";
    row.innerHTML = `
      <a href="${getFileUrl(documentItem)}" target="_blank" rel="noreferrer" download="${escapeHtml(documentItem.name)}">${escapeHtml(documentItem.name)}</a>
      <span>${formatFileSize(documentItem.size)}</span>
      <button class="secondary-button danger" type="button">Удалить</button>
    `;
    row.querySelector("button").addEventListener("click", async () => {
      await deleteFile(project, documentItem);
      renderDocuments(project);
    });
    elements.documentList.append(row);
  });
}

function updateActiveProjectFromForm() {
  const project = getActiveProject();

  if (!project) {
    return null;
  }

  fields.forEach((field) => {
    project[field] = document.querySelector(`#${field}`).value.trim();
  });

  project.updatedAt = new Date().toISOString();
  return project;
}

async function addFiles(fileList, kind) {
  const project = getActiveProject();
  const files = Array.from(fileList);
  const category = state.currentFileItem?.label || "";

  if (state.serverMode) {
    const uploadedFiles = [];

    for (const file of files) {
      uploadedFiles.push(await uploadServerFile(project, file, kind, category));
    }

    if (kind === "image") {
      project.images.push(...uploadedFiles);
      renderImages(project);
    } else {
      project.documents.push(...uploadedFiles);
      renderDocuments(project);
    }
  } else {
    const savedFiles = await Promise.all(files.map((file) => fileToStoredObject(file, kind, category)));

    if (kind === "image") {
      project.images.push(...savedFiles);
      renderImages(project);
    } else {
      project.documents.push(...savedFiles);
      renderDocuments(project);
    }

    saveLocalProjects();
  }

  renderSections(project);
}

async function uploadServerFile(project, file, kind, category = "") {
  await persistProject(project);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("kind", kind);
  formData.append("fileCategory", category);

  const data = await apiRequest(`/projects/${project.id}/files`, {
    method: "POST",
    body: formData,
  });

  return fromApiFile(data.file);
}

async function deleteFile(project, file) {
  const targetList = file.kind === "image" ? project.images : project.documents;
  const index = targetList.findIndex((item) => item.id === file.id);

  if (index >= 0) {
    targetList.splice(index, 1);
  }

  if (state.serverMode) {
    await apiRequest(`/files/${file.id}`, { method: "DELETE" });
  } else {
    saveLocalProjects();
  }

  renderSections(project);
}

function fileToStoredObject(file, kind, category = "") {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve({
        id: createId(),
        kind,
        name: file.name,
        size: file.size,
        type: file.type,
        category,
        dataUrl: reader.result,
        addedAt: new Date().toISOString(),
      });
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getFileUrl(file) {
  if (file.dataUrl) {
    return file.dataUrl;
  }

  if (file.url) {
    return file.url;
  }

  return "#";
}

function createProject() {
  const now = new Date().toISOString();

  return {
    id: createId(),
    title: "Новый участок",
    summary: "",
    address: "",
    status: "",
    responsible: "",
    region: "",
    area: "",
    comments: "",
    areaPoints: [],
    areaSquareMeters: 0,
    lat: "",
    lng: "",
    images: [],
    documents: [],
    sections: defaultSections.map((section) => ({
      title: section.title,
      subtitle: section.subtitle,
      items: section.items.map(([label, note, required, optional, type]) => ({
        label,
        note,
        required: Boolean(required),
        optional: Boolean(optional),
        type: type || "text",
        value: "",
        date: "",
        comment: "",
        calendarMonth: "",
        calendarYear: "",
        calendarOpen: false,
      })),
    })),
    createdAt: now,
    updatedAt: now,
  };
}

function normalizeProject(project) {
  return {
    ...createProject(),
    ...project,
    images: (project.images || []).map((file) => ({ ...file, kind: "image" })),
    documents: (project.documents || []).map((file) => ({ ...file, kind: "document" })),
    sections: normalizeSections(project.sections),
    areaPoints: project.areaPoints || [],
    areaSquareMeters: project.areaSquareMeters || 0,
  };
}

function normalizeSections(sections) {
  const existingSections = Array.isArray(sections) ? sections : [];

  return defaultSections.map((template, sectionIndex) => {
    const existingSection =
      existingSections.find((section) => normalizeSectionTitle(section.title) === normalizeSectionTitle(template.title)) ||
      existingSections[sectionIndex] ||
      {};
    const existingItems = Array.isArray(existingSection.items) ? existingSection.items : [];

    return {
      title: template.title,
      subtitle: template.subtitle,
      items: template.items.map(([label, note, required, optional, type], itemIndex) => {
        const existingItem = findExistingItem(existingItems, label, itemIndex);

        return {
          label,
          note,
          required: Boolean(required),
          optional: Boolean(optional),
          type: type || "text",
          value: typeof existingItem === "object" ? existingItem.value || "" : "",
          date: typeof existingItem === "object" ? existingItem.date || "" : "",
          comment: typeof existingItem === "object" ? existingItem.comment || "" : "",
          calendarMonth: typeof existingItem === "object" ? existingItem.calendarMonth ?? "" : "",
          calendarYear: typeof existingItem === "object" ? existingItem.calendarYear ?? "" : "",
          calendarOpen: false,
        };
      }),
    };
  });
}

function normalizeSectionTitle(title = "") {
  return String(title).replace(/^\d+\.\s*/, "");
}

function findExistingItem(existingItems, label, itemIndex) {
  const aliases = {};
  const labels = [label, ...(aliases[label] || [])];
  const byLabel = existingItems.find((item) => typeof item === "object" && labels.includes(item.label));

  if (byLabel) {
    return byLabel;
  }

  const byIndex = existingItems[itemIndex];
  return typeof byIndex === "object" && byIndex.label === label ? byIndex : {};
}

function getActiveProject() {
  return state.projects.find((project) => project.id === state.activeId) || state.projects[0];
}

function queueProjectSave(project) {
  window.clearTimeout(state.saveTimer);
  state.saveTimer = window.setTimeout(() => {
    persistProject(project);
  }, 500);
}

async function persistProject(project) {
  if (!project) {
    return;
  }

  project.updatedAt = new Date().toISOString();

  if (!state.serverMode) {
    saveLocalProjects();
    return;
  }

  await apiRequest(`/projects/${project.id}`, {
    method: "PUT",
    body: toApiProject(project),
  }).catch(async (error) => {
    if (error.status !== 404) {
      throw error;
    }

    await apiRequest("/projects", {
      method: "POST",
      body: toApiProject(project),
    });
  });
}

async function deleteProjects(projectIds) {
  const ids = projectIds.filter(Boolean);

  if (ids.length === 0) {
    alert("Выберите один или несколько проектов для удаления.");
    return;
  }

  if (state.serverMode) {
    for (const id of ids) {
      await apiRequest(`/projects/${id}`, { method: "DELETE" });
    }
  }

  state.projects = state.projects.filter((project) => !ids.includes(project.id));
  state.selectedIds.clear();
  state.deleteMode = false;
  state.activeId = state.projects[0]?.id || null;
  state.view = "registry";
  saveLocalProjects();

  render();
}

function loadLocalProjects() {
  try {
    return (JSON.parse(localStorage.getItem(STORAGE_KEY)) || []).map(normalizeProject);
  } catch {
    return [];
  }
}

function saveLocalProjects() {
  if (state.serverMode) {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.projects));
  } catch {
    alert("Браузер не смог сохранить данные. Обычно это происходит из-за слишком большого объема файлов.");
  }
}

function exportProjects() {
  const blob = new Blob([JSON.stringify(state.projects, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `land-projects-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function importProjects(file) {
  if (!file) {
    return Promise.resolve();
  }

  return file.text().then(async (content) => {
    try {
      const projects = JSON.parse(content);

      if (!Array.isArray(projects)) {
        throw new Error("Invalid format");
      }

      state.projects = projects.map(normalizeProject);
      state.activeId = state.projects[0]?.id || null;

      if (state.serverMode) {
        for (const project of state.projects) {
          await persistProject(project);
        }
      } else {
        saveLocalProjects();
      }

      render();
    } catch {
      alert("Не удалось импортировать файл. Нужен JSON, экспортированный из этой панели.");
    }
  });
}

async function apiRequest(path, options = {}) {
  const headers = {
    ...(options.headers || {}),
  };
  const request = {
    method: options.method || "GET",
    headers,
  };

  if (state.apiToken) {
    headers.Authorization = `Bearer ${state.apiToken}`;
  }

  if (options.body instanceof FormData) {
    request.body = options.body;
  } else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    request.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${apiBaseUrl}${path}`, request);

  if (response.status === 204) {
    return {};
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || `HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return data;
}

function toApiProject(project) {
  return {
    id: project.id,
    title: project.title || "Новый участок",
    summary: project.summary || "",
    address: project.address || "",
    status: project.status || "",
    responsible: project.responsible || "",
    region: project.region || "",
    area: project.area || "",
    comments: project.comments || "",
    lat: project.lat ? Number(project.lat) : null,
    lng: project.lng ? Number(project.lng) : null,
    areaSquareMeters: project.areaSquareMeters || 0,
    areaPoints: project.areaPoints || [],
    sections: project.sections || [],
  };
}

function fromApiProject(project, files) {
  const projectFiles = files.map(fromApiFile);

  return normalizeProject({
    id: project.id,
    title: project.title,
    summary: project.summary,
    address: project.address,
    status: project.status,
    responsible: project.responsible,
    region: project.region,
    area: project.area,
    comments: project.comments,
    lat: project.lat ? String(project.lat) : "",
    lng: project.lng ? String(project.lng) : "",
    areaSquareMeters: Number(project.area_square_meters || project.areaSquareMeters || 0),
    areaPoints: project.area_points || project.areaPoints || [],
    sections: project.sections || [],
    images: projectFiles.filter((file) => file.kind === "image"),
    documents: projectFiles.filter((file) => file.kind === "document"),
    createdAt: project.created_at,
    updatedAt: project.updated_at,
  });
}

function fromApiFile(file) {
  return {
    id: file.id,
    kind: file.kind,
    name: file.name,
    size: file.size,
    type: file.type,
    category: file.file_category || "",
    storagePath: file.storage_path,
    url: `${apiBaseUrl}/files/${file.id}/download?token=${encodeURIComponent(state.apiToken)}`,
    addedAt: file.created_at,
  };
}

function formatDate(value) {
  if (!value) {
    return "нет даты";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatFileSize(bytes) {
  if (!bytes) {
    return "0 Б";
  }

  const units = ["Б", "КБ", "МБ", "ГБ"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;

  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatArea(squareMeters) {
  const hectares = squareMeters / 10000;

  if (hectares >= 1) {
    return `${hectares.toFixed(2)} га`;
  }

  return `${Math.round(squareMeters)} м²`;
}

function sanitizeFileName(name) {
  return name.replace(/[^\w.\-а-яА-ЯёЁ]/g, "_");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (character) =>
    (Number(character) ^ (Math.random() * 16 >> (Number(character) / 4))).toString(16),
  );
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function wrapLng(lng) {
  return ((((lng + 180) % 360) + 360) % 360) - 180;
}
