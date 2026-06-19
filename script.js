const STORAGE_KEY = "landProjects.v1";
const TRASH_STORAGE_KEY = "landProjects.trash.v1";
const API_TOKEN_KEY = "landProjects.apiToken";
const PROFILE_PHOTO_KEY = "landProjects.profilePhoto";
const PROFILE_DESCRIPTION_KEY = "landProjects.profileDescription";
const USER_PASSWORDS_KEY = "landProjects.userPasswords";
const CUSTOM_ROLES_KEY = "landProjects.customRoles";
const USER_ROLE_ASSIGNMENTS_KEY = "landProjects.userRoleAssignments";

const apiConfig = window.API_CONFIG || {};
const apiBaseUrl = (apiConfig.baseUrl || "").replace(/\/$/, "");
const isApiConfigured = Boolean(apiBaseUrl);

const state = {
  projects: [],
  trashProjects: [],
  activeId: null,
  selectedIds: new Set(),
  deleteMode: false,
  view: "registry",
  sidebarCollapsed: false,
  user: null,
  profile: null,
  serverMode: false,
  users: [],
  customRoles: loadCustomRoles(),
  userRoleAssignments: loadUserRoleAssignments(),
  userPasswords: loadUserPasswords(),
  editingUserId: null,
  editingRoleId: null,
  apiToken: localStorage.getItem(API_TOKEN_KEY) || "",
  profilePhoto: localStorage.getItem(PROFILE_PHOTO_KEY) || "",
  profileDescriptionTimer: null,
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
  headerMenuCloseBtn: document.querySelector("#headerMenuCloseBtn"),
  headerMenuBackdrop: document.querySelector("#headerMenuBackdrop"),
  headerMenu: document.querySelector("#headerMenu"),
  menuAccountBtn: document.querySelector("#menuAccountBtn"),
  menuProjectsBtn: document.querySelector("#menuProjectsBtn"),
  menuUsersBtn: document.querySelector("#menuUsersBtn"),
  menuRolesBtn: document.querySelector("#menuRolesBtn"),
  menuTrashBtn: document.querySelector("#menuTrashBtn"),
  globalSearchInput: document.querySelector("#globalSearchInput"),
  headerProfileBtn: document.querySelector("#headerProfileBtn"),
  headerProfileInitials: document.querySelector("#headerProfileInitials"),
  signOutBtn: document.querySelector("#signOutBtn"),
  cabinetPanel: document.querySelector("#cabinetPanel"),
  cabinetTitle: document.querySelector("#cabinetTitle"),
  cabinetRole: document.querySelector("#cabinetRole"),
  cabinetUserEmail: document.querySelector("#cabinetUserEmail"),
  cabinetUserName: document.querySelector("#cabinetUserName"),
  accountAvatarInitials: document.querySelector("#accountAvatarInitials"),
  profilePhotoInput: document.querySelector("#profilePhotoInput"),
  profileDescriptionInput: document.querySelector("#profileDescriptionInput"),
  accountEmailValue: document.querySelector("#accountEmailValue"),
  accountIdValue: document.querySelector("#accountIdValue"),
  accountSessionValue: document.querySelector("#accountSessionValue"),
  profileProjectList: document.querySelector("#profileProjectList"),
  userAdminPanel: document.querySelector("#userAdminPanel"),
  rolesAdminPanel: document.querySelector("#rolesAdminPanel"),
  openCreateUserModalBtn: document.querySelector("#openCreateUserModalBtn"),
  userSearchInput: document.querySelector("#userSearchInput"),
  userList: document.querySelector("#userList"),
  roleSearchInput: document.querySelector("#roleSearchInput"),
  roleList: document.querySelector("#roleList"),
  openCreateRoleModalBtn: document.querySelector("#openCreateRoleModalBtn"),
  userModal: document.querySelector("#userModal"),
  userModalForm: document.querySelector("#userModalForm"),
  userModalEyebrow: document.querySelector("#userModalEyebrow"),
  userModalTitle: document.querySelector("#userModalTitle"),
  userModalFullName: document.querySelector("#userModalFullName"),
  userModalEmail: document.querySelector("#userModalEmail"),
  userModalPassword: document.querySelector("#userModalPassword"),
  userPasswordRevealBtn: document.querySelector("#userPasswordRevealBtn"),
  userModalPasswordNote: document.querySelector("#userModalPasswordNote"),
  userModalAccess: document.querySelector("#userModalAccess"),
  userModalCustomRole: document.querySelector("#userModalCustomRole"),
  saveUserModalBtn: document.querySelector("#saveUserModalBtn"),
  closeUserModalBtn: document.querySelector("#closeUserModalBtn"),
  userProfileSummary: document.querySelector("#userProfileSummary"),
  roleModal: document.querySelector("#roleModal"),
  roleModalForm: document.querySelector("#roleModalForm"),
  roleModalTitle: document.querySelector("#roleModalTitle"),
  roleModalName: document.querySelector("#roleModalName"),
  roleModalDescription: document.querySelector("#roleModalDescription"),
  saveRoleModalBtn: document.querySelector("#saveRoleModalBtn"),
  closeRoleModalBtn: document.querySelector("#closeRoleModalBtn"),
  registryView: document.querySelector("#registryView"),
  trashView: document.querySelector("#trashView"),
  trashTableBody: document.querySelector("#trashTableBody"),
  clearTrashBtn: document.querySelector("#clearTrashBtn"),
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
  filePreviewModal: document.querySelector("#filePreviewModal"),
  filePreviewType: document.querySelector("#filePreviewType"),
  filePreviewTitle: document.querySelector("#filePreviewTitle"),
  filePreviewBody: document.querySelector("#filePreviewBody"),
  closeFilePreviewBtn: document.querySelector("#closeFilePreviewBtn"),
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
    await loadRoles();
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

  elements.userModalForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    await saveUserFromModal();
  });
  elements.roleModalForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    await saveRoleFromModal();
  });
  elements.openCreateUserModalBtn?.addEventListener("click", () => openUserModal());
  elements.closeUserModalBtn?.addEventListener("click", closeUserModal);
  elements.openCreateRoleModalBtn?.addEventListener("click", () => openRoleModal());
  elements.closeRoleModalBtn?.addEventListener("click", closeRoleModal);
  elements.closeFilePreviewBtn?.addEventListener("click", closeFilePreview);
  elements.filePreviewModal?.addEventListener("click", (event) => {
    if (event.target === elements.filePreviewModal) {
      closeFilePreview();
    }
  });
  elements.userModal?.addEventListener("click", (event) => {
    if (event.target === elements.userModal) {
      closeUserModal();
    }
  });
  elements.roleModal?.addEventListener("click", (event) => {
    if (event.target === elements.roleModal) {
      closeRoleModal();
    }
  });

  elements.userSearchInput?.addEventListener("input", renderUsers);
  elements.roleSearchInput?.addEventListener("input", renderRoles);
  elements.headerMenuBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleSidebar();
  });
  elements.headerMenuCloseBtn?.addEventListener("click", () => setSideMenuOpen(false));
  elements.headerMenuBackdrop?.addEventListener("click", () => setSideMenuOpen(false));
  elements.menuAccountBtn?.addEventListener("click", () => navigateToView("cabinet"));
  elements.menuProjectsBtn?.addEventListener("click", () => navigateToView("registry"));
  elements.menuUsersBtn?.addEventListener("click", () => {
    if (state.profile?.role !== "admin") {
      return;
    }
    navigateToView("users");
  });
  elements.menuRolesBtn?.addEventListener("click", () => {
    if (state.profile?.role !== "admin") {
      return;
    }
    navigateToView("roles");
  });
  elements.menuTrashBtn?.addEventListener("click", () => {
    navigateToView("trash");
  });
  elements.clearTrashBtn?.addEventListener("click", clearTrash);
  elements.headerProfileBtn?.addEventListener("click", () => navigateToView("cabinet"));
  elements.profilePhotoInput?.addEventListener("change", handleProfilePhotoUpload);
  elements.profileDescriptionInput?.addEventListener("input", () => {
    const value = elements.profileDescriptionInput.value;
    localStorage.setItem(PROFILE_DESCRIPTION_KEY, value);
    if (!state.serverMode) {
      return;
    }
    window.clearTimeout(state.profileDescriptionTimer);
    state.profileDescriptionTimer = window.setTimeout(async () => {
      try {
        const data = await apiRequest("/auth/me", {
          method: "PATCH",
          body: { profileDescription: value },
        });
        state.user = data.user;
        state.profile = data.user;
      } catch (error) {
        console.error(error);
      }
    }, 600);
  });
  elements.userPasswordRevealBtn?.addEventListener("pointerdown", () => setUserPasswordVisible(true));
  elements.userPasswordRevealBtn?.addEventListener("pointerup", () => setUserPasswordVisible(false));
  elements.userPasswordRevealBtn?.addEventListener("pointerleave", () => setUserPasswordVisible(false));
  elements.userPasswordRevealBtn?.addEventListener("blur", () => setUserPasswordVisible(false));
  elements.globalSearchInput?.addEventListener("input", handleGlobalSearch);
  elements.globalSearchInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      navigateToView("registry");
      handleGlobalSearch();
    }
  });
  document.addEventListener("click", (event) => {
    if (!elements.headerMenu?.classList.contains("is-open")) {
      return;
    }
    if (!elements.headerMenu.contains(event.target) && !elements.headerMenuBtn?.contains(event.target)) {
      setSideMenuOpen(false);
    }
  });
  document.addEventListener("click", (event) => {
    if (!elements.statusDropdown || elements.statusDropdown.hidden) {
      return;
    }
    if (!elements.statusDropdown.contains(event.target) && !elements.statusPickerBtn?.contains(event.target)) {
      elements.statusDropdown.hidden = true;
    }
  });

  elements.signOutBtn?.addEventListener("click", () => {
    setSideMenuOpen(false);
    signOut();
  });

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

  elements.statusPickerBtn.addEventListener("click", (event) => {
    event.stopPropagation();
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
    state.view = "registry";
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
    state.view = "registry";
    await loadRoles();
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
  state.view = "registry";
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
    state.view = "registry";
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
    if (!state.user || state.serverMode) {
      state.users = [];
    }
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

async function loadRoles() {
  if (!isApiConfigured || state.profile?.role !== "admin") {
    return;
  }

  try {
    const data = await apiRequest("/roles");
    state.customRoles = (data.roles || []).map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description || "",
      createdAt: role.created_at,
      updatedAt: role.updated_at,
    }));
  } catch (error) {
    console.error(error);
  }
}

async function saveUserFromModal() {
  if (state.profile?.role !== "admin") {
    return;
  }

  const isEdit = Boolean(state.editingUserId);
  const fullName = elements.userModalFullName.value.trim();
  const email = elements.userModalEmail.value.trim();
  const password = elements.userModalPassword.value;
  const access = elements.userModalAccess.value;
  const customRoleId = elements.userModalCustomRole.value;

  if (!isEdit && password.length < 8) {
    alert("Пароль должен быть минимум 8 символов.");
    return;
  }

  if (!state.serverMode) {
    if (isEdit) {
      const user = state.users.find((item) => item.id === state.editingUserId);
      if (user) {
        user.email = email;
        user.full_name = fullName;
        user.role = access;
        user.user_role_id = customRoleId || null;
        user.updated_at = new Date().toISOString();
      }
    } else {
      const user = {
        id: createId(),
        email,
        full_name: fullName,
        role: access,
        user_role_id: customRoleId || null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      state.users.unshift(user);
      state.editingUserId = user.id;
    }
    if (password) {
      saveUserPassword(state.editingUserId, password);
    }
    assignCustomRole(state.editingUserId, customRoleId);
    closeUserModal();
    renderUsers();
    renderRoles();
    return;
  }

  try {
    if (isEdit) {
      const updates = {
        fullName,
        role: access,
        userRoleId: customRoleId || null,
      };
      if (password) {
        updates.password = password;
      }
      await apiRequest(`/users/${state.editingUserId}`, {
        method: "PATCH",
        body: updates,
      });
    } else {
      const data = await apiRequest("/users", {
        method: "POST",
        body: {
          fullName,
          email,
          password,
          role: access,
          userRoleId: customRoleId || null,
        },
      });
    }

    closeUserModal();
    await loadUsers();
    renderUsers();
    renderRoles();
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
    renderRoles();
    return;
  }

  try {
    await apiRequest(`/users/${userId}`, {
      method: "PATCH",
      body: updates,
    });
    await loadUsers();
    renderUsers();
    renderRoles();
  } catch (error) {
    alert(error.message);
  }
}

async function deleteUserFromAdmin(userId) {
  if (state.profile?.role !== "admin") {
    return;
  }

  if (userId === state.user?.id) {
    alert("Нельзя удалить текущий аккаунт.");
    return;
  }

  const user = state.users.find((item) => item.id === userId);
  const userName = user?.full_name || user?.email || "пользователя";

  if (!confirm(`Удалить ${userName}? Это действие нельзя отменить.`)) {
    return;
  }

  if (!state.serverMode) {
    state.users = state.users.filter((item) => item.id !== userId);
    delete state.userRoleAssignments[userId];
    delete state.userPasswords[userId];
    saveUserRoleAssignments();
    saveUserPasswords();
    renderUsers();
    renderRoles();
    return;
  }

  try {
    await apiRequest(`/users/${userId}`, { method: "DELETE" });
    delete state.userRoleAssignments[userId];
    delete state.userPasswords[userId];
    saveUserRoleAssignments();
    saveUserPasswords();
    await loadUsers();
    renderUsers();
    renderRoles();
  } catch (error) {
    alert(error.message);
  }
}

function openUserModal(userId = null) {
  if (state.profile?.role !== "admin") {
    return;
  }

  const user = userId ? state.users.find((item) => item.id === userId) : null;
  state.editingUserId = user?.id || null;
  populateCustomRoleSelect(elements.userModalCustomRole, user ? getAssignedCustomRoleId(user.id) : "");

  if (elements.userModalTitle) {
    elements.userModalTitle.textContent = user ? "Редактировать пользователя" : "Добавить пользователя";
  }
  if (elements.userModalEyebrow) {
    elements.userModalEyebrow.textContent = user ? "Редактирование" : "Новый пользователь";
  }
  if (elements.saveUserModalBtn) {
    elements.saveUserModalBtn.textContent = user ? "Сохранить" : "Добавить";
  }
  if (elements.userModalPasswordNote) {
    elements.userModalPasswordNote.textContent = user ? "Оставьте пустым, чтобы не менять пароль" : "Минимум 8 символов";
  }
  if (elements.userModalFullName) {
    elements.userModalFullName.value = user?.full_name || "";
  }
  if (elements.userModalEmail) {
    elements.userModalEmail.value = user?.email || "";
    elements.userModalEmail.disabled = Boolean(user && state.serverMode);
  }
  if (elements.userModalPassword) {
    elements.userModalPassword.value = user ? getStoredUserPassword(user.id) : "";
    elements.userModalPassword.required = !user;
    elements.userModalPassword.type = "password";
  }
  if (elements.userModalAccess) {
    elements.userModalAccess.value = user?.role || "user";
  }
  if (elements.userProfileSummary) {
    elements.userProfileSummary.hidden = true;
    elements.userProfileSummary.innerHTML = "";
  }
  if (elements.userModal) {
    elements.userModal.hidden = false;
  }
}

function openUserProfile(userId) {
  if (state.profile?.role !== "admin") {
    return;
  }

  const user = state.users.find((item) => item.id === userId);
  if (!user) {
    return;
  }

  openUserModal(userId);
  const assignedRole = getAssignedCustomRole(user.id);
  const accessLabel = user.role === "admin" ? "Администратор" : "Пользователь";
  const storedPassword = getStoredUserPassword(user.id);
  const assignedProjects = getProjectsForUser(user);
  const assignedProjectText = assignedProjects.length > 0
    ? assignedProjects.map((project) => `${project.title || "Без названия"} (${formatDate(project.createdAt)})`).join(", ")
    : "Не назначены";

  if (elements.userModalTitle) {
    elements.userModalTitle.textContent = "Профиль пользователя";
  }
  if (elements.userModalEyebrow) {
    elements.userModalEyebrow.textContent = "Просмотр";
  }
  if (elements.userProfileSummary) {
    elements.userProfileSummary.hidden = false;
    elements.userProfileSummary.innerHTML = `
      <div><span>ID</span><strong>${escapeHtml(user.id || "-")}</strong></div>
      <div><span>ФИО</span><strong>${escapeHtml(user.full_name || "Не указано")}</strong></div>
      <div><span>Email</span><strong>${escapeHtml(user.email || "Без email")}</strong></div>
      <div><span>Доступ</span><strong>${escapeHtml(accessLabel)}</strong></div>
      <div><span>Роль</span><strong>${escapeHtml(assignedRole?.name || "Не назначена")}</strong></div>
      <div><span>Проекты</span><strong>${escapeHtml(assignedProjectText)}</strong></div>
      <div>
        <span>Пароль</span>
        <strong class="masked-password" data-password-value="${escapeHtml(storedPassword)}">
          <span class="masked-password-value">${storedPassword ? "••••••••" : "Не сохранён"}</span>
          ${storedPassword ? `<button class="inline-eye-button" type="button" aria-label="Показать пароль">◉</button>` : ""}
        </strong>
      </div>
      <div><span>Статус</span><strong>${user.is_active === false ? "Отключен" : "Активен"}</strong></div>
    `;
    const eyeButton = elements.userProfileSummary.querySelector(".inline-eye-button");
    const passwordNode = elements.userProfileSummary.querySelector(".masked-password");
    const passwordValue = elements.userProfileSummary.querySelector(".masked-password-value");
    if (eyeButton && passwordNode && passwordValue) {
      const show = () => {
        passwordValue.textContent = passwordNode.dataset.passwordValue;
      };
      const hide = () => {
        passwordValue.textContent = "••••••••";
      };
      eyeButton.addEventListener("pointerdown", show);
      eyeButton.addEventListener("pointerup", hide);
      eyeButton.addEventListener("pointerleave", hide);
      eyeButton.addEventListener("blur", hide);
    }
  }
}

function closeUserModal() {
  state.editingUserId = null;
  elements.userModalForm?.reset();
  if (elements.userModalEmail) {
    elements.userModalEmail.disabled = false;
  }
  if (elements.userProfileSummary) {
    elements.userProfileSummary.hidden = true;
    elements.userProfileSummary.innerHTML = "";
  }
  if (elements.userModal) {
    elements.userModal.hidden = true;
  }
}

function openRoleModal(roleId = null) {
  const role = roleId ? state.customRoles.find((item) => item.id === roleId) : null;
  state.editingRoleId = role?.id || null;
  if (elements.roleModalTitle) {
    elements.roleModalTitle.textContent = role ? "Редактировать роль" : "Добавить роль";
  }
  if (elements.saveRoleModalBtn) {
    elements.saveRoleModalBtn.textContent = role ? "Сохранить" : "Добавить";
  }
  if (elements.roleModalName) {
    elements.roleModalName.value = role?.name || "";
  }
  if (elements.roleModalDescription) {
    elements.roleModalDescription.value = role?.description || "";
  }
  if (elements.roleModal) {
    elements.roleModal.hidden = false;
  }
}

function closeRoleModal() {
  state.editingRoleId = null;
  elements.roleModalForm?.reset();
  if (elements.roleModal) {
    elements.roleModal.hidden = true;
  }
}

async function saveRoleFromModal() {
  if (state.profile?.role !== "admin") {
    return;
  }

  const name = elements.roleModalName.value.trim();
  const description = elements.roleModalDescription.value.trim();
  if (!name) {
    return;
  }

  if (state.serverMode) {
    try {
      if (state.editingRoleId) {
        await apiRequest(`/roles/${state.editingRoleId}`, {
          method: "PATCH",
          body: { name, description },
        });
      } else {
        await apiRequest("/roles", {
          method: "POST",
          body: { name, description },
        });
      }

      closeRoleModal();
      await loadRoles();
      await loadUsers();
      renderRoles();
      renderUsers();
    } catch (error) {
      alert(error.message);
    }
    return;
  }

  if (state.editingRoleId) {
    const role = state.customRoles.find((item) => item.id === state.editingRoleId);
    if (role) {
      role.name = name;
      role.description = description;
      role.updatedAt = new Date().toISOString();
    }
  } else {
    state.customRoles.unshift({
      id: createId(),
      name,
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  saveCustomRoles();
  closeRoleModal();
  renderRoles();
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
      elements.serverStatus.textContent = `Серверный режим: вход выполнен как ${state.user.email}. Доступ: ${role}.`;
    }
    if (elements.signOutBtn) {
      elements.signOutBtn.hidden = false;
    }
    if (elements.appServerStatus) {
      const role = state.profile?.role === "admin" ? "admin" : "user";
      elements.appServerStatus.textContent = `Вход выполнен: ${state.user.email}. Доступ: ${role}.`;
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
  if (!elements.headerProfileInitials) {
    return;
  }

  if (!state.user) {
    elements.headerProfileInitials.textContent = "U";
    renderAvatarElement(elements.headerProfileInitials, "U");
    return;
  }

  const name = state.user.full_name || state.user.fullName || state.user.email || "Пользователь";

  renderAvatarElement(elements.headerProfileInitials, getUserInitials(name));
}

function handleGlobalSearch() {
  const query = elements.globalSearchInput?.value || "";

  if (elements.search) {
    elements.search.value = query;
  }
  if (elements.userSearchInput) {
    elements.userSearchInput.value = query;
  }
  if (elements.roleSearchInput) {
    elements.roleSearchInput.value = query;
  }

  renderProjectTable();
  renderTrashTable();
  renderUsers();
  renderRoles();
}

async function loadInitialProjects() {
  state.projects = state.serverMode ? await loadServerProjects() : loadLocalProjects();
  state.trashProjects = state.serverMode ? await loadServerTrashProjects() : loadLocalTrashProjects();
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

async function loadServerTrashProjects() {
  try {
    const data = await apiRequest("/projects/trash/list");
    return (data.projects || []).map((project) => fromApiProject(project, []));
  } catch (error) {
    console.error(error);
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

  if ((state.view === "users" || state.view === "roles") && state.profile?.role !== "admin") {
    state.view = "registry";
  }

  if (elements.cabinetPanel) {
    elements.cabinetPanel.hidden = state.view !== "cabinet";
  }
  if (elements.userAdminPanel) {
    elements.userAdminPanel.hidden = state.view !== "users" || state.profile?.role !== "admin";
  }
  if (elements.rolesAdminPanel) {
    elements.rolesAdminPanel.hidden = state.view !== "roles" || state.profile?.role !== "admin";
  }
  if (elements.trashView) {
    elements.trashView.hidden = state.view !== "trash";
  }
  if (elements.clearTrashBtn) {
    elements.clearTrashBtn.hidden = !canDeleteProjects();
    elements.clearTrashBtn.disabled = state.trashProjects.length === 0;
  }
  elements.registryView.hidden = state.view !== "registry";
  elements.detailView.hidden = state.view !== "detail";
  elements.deleteBtn.hidden = !canDeleteProjects();
  renderCabinet();
  renderUsers();
  renderRoles();
  renderProjectTable();
  renderTrashTable();
  updateSideMenuState();
  updateSidebarLayout();

  if (state.view === "detail") {
    renderForm();
  }
}

function isMobileSidebar() {
  return window.matchMedia("(max-width: 900px)").matches;
}

function toggleSidebar() {
  if (isMobileSidebar()) {
    setSideMenuOpen(!elements.headerMenu?.classList.contains("is-open"));
    return;
  }

  state.sidebarCollapsed = !state.sidebarCollapsed;
  setSideMenuOpen(false);
  updateSidebarLayout();
}

function setSideMenuOpen(isOpen) {
  if (elements.headerMenu) {
    elements.headerMenu.classList.toggle("is-open", isOpen);
  }
  if (elements.headerMenuBackdrop) {
    elements.headerMenuBackdrop.hidden = !isOpen;
  }
  if (elements.headerMenuBtn) {
    elements.headerMenuBtn.setAttribute("aria-expanded", String(isOpen));
  }
}

function updateSidebarLayout() {
  if (elements.appShell) {
    elements.appShell.classList.toggle("sidebar-collapsed", state.sidebarCollapsed);
  }
  if (elements.headerMenuBtn && !isMobileSidebar()) {
    elements.headerMenuBtn.setAttribute("aria-expanded", String(!state.sidebarCollapsed));
  }
}

function navigateToView(view) {
  closeAdminModals();
  closeParamModal();
  state.view = view;
  state.deleteMode = false;
  state.selectedIds.clear();
  setSideMenuOpen(false);
  render();
}

function closeAdminModals() {
  closeUserModal();
  closeRoleModal();
}

function updateSideMenuState() {
  elements.menuAccountBtn?.classList.toggle("is-active", state.view === "cabinet");
  elements.menuProjectsBtn?.classList.toggle("is-active", state.view === "registry" || state.view === "detail");
  elements.menuUsersBtn?.classList.toggle("is-active", state.view === "users");
  elements.menuRolesBtn?.classList.toggle("is-active", state.view === "roles");
  elements.menuTrashBtn?.classList.toggle("is-active", state.view === "trash");

  if (elements.menuUsersBtn) {
    elements.menuUsersBtn.hidden = state.profile?.role !== "admin";
  }
  if (elements.menuRolesBtn) {
    elements.menuRolesBtn.hidden = state.profile?.role !== "admin";
  }
  if (elements.menuTrashBtn) {
    elements.menuTrashBtn.hidden = false;
  }
}

function renderCabinet() {
  if (!elements.cabinetPanel || !state.user) {
    return;
  }

  const role = state.profile?.role === "admin" ? "admin" : "user";
  const roleLabel = role === "admin" ? "Администратор" : "Пользователь";
  const displayName = state.user.full_name || state.user.fullName || "";

  if (elements.cabinetTitle) {
    elements.cabinetTitle.textContent = "Профиль";
  }
  if (elements.cabinetRole) {
    elements.cabinetRole.textContent = roleLabel;
  }
  if (elements.cabinetUserEmail) {
    elements.cabinetUserEmail.textContent = state.user.email || "Без email";
  }
  if (elements.cabinetUserName) {
    elements.cabinetUserName.textContent = displayName || "Имя не указано";
  }
  if (elements.accountAvatarInitials) {
    renderAvatarElement(elements.accountAvatarInitials, getUserInitials(displayName || state.user.email || "U"));
  }
  if (elements.accountEmailValue) {
    elements.accountEmailValue.textContent = state.user.email || "Без email";
  }
  if (elements.accountIdValue) {
    elements.accountIdValue.textContent = state.user.id || "Не указан";
  }
  if (elements.accountSessionValue) {
    elements.accountSessionValue.textContent = state.user ? "Активен" : "Не активен";
  }
  if (elements.profileDescriptionInput) {
    elements.profileDescriptionInput.value = state.user.profile_description || localStorage.getItem(PROFILE_DESCRIPTION_KEY) || "";
  }
  renderProfileProjects();
}

function handleProfilePhotoUpload(event) {
  const [file] = event.target.files || [];

  if (!file) {
    return;
  }

  if (!file.type.startsWith("image/")) {
    alert("Выберите изображение для фотографии профиля.");
    event.target.value = "";
    return;
  }

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    state.profilePhoto = reader.result;
    try {
      localStorage.setItem(PROFILE_PHOTO_KEY, state.profilePhoto);
    } catch (error) {
      console.error(error);
      alert("Не удалось сохранить фото профиля в браузере.");
    }
    updateHeaderAccount();
    renderCabinet();
  });
  reader.readAsDataURL(file);
}

function renderProfileProjects() {
  if (!elements.profileProjectList || !state.user) {
    return;
  }

  const projects = getProjectsForUser(state.user);

  if (projects.length === 0) {
    elements.profileProjectList.innerHTML = `<p class="profile-empty-text">Проекты не назначены</p>`;
    return;
  }

  elements.profileProjectList.innerHTML = projects
    .map(
      (project) => `
        <button class="profile-project-item" type="button" data-project-id="${escapeHtml(project.id)}">
          <span>${escapeHtml(project.title || "Без названия")}</span>
          <small>${escapeHtml(project.status || "Без статуса")}</small>
        </button>
      `,
    )
    .join("");

  elements.profileProjectList.querySelectorAll("[data-project-id]").forEach((button) => {
    const project = state.projects.find((item) => item.id === button.dataset.projectId);
    if (project) {
      const meta = document.createElement("small");
      meta.textContent = `${formatDate(project.createdAt)} · ${project.projectKey || project.id || "-"}`;
      button.append(meta);
    }
    button.addEventListener("click", () => openProject(button.dataset.projectId));
  });
}

function getProjectsForUser(user) {
  if (!user) {
    return [];
  }

  const userNames = [user.full_name, user.email].filter(Boolean);
  return state.projects.filter((project) => userNames.includes(project.responsible));
}

function setUserPasswordVisible(isVisible) {
  if (elements.userModalPassword) {
    elements.userModalPassword.type = isVisible ? "text" : "password";
  }
}

function saveUserPassword(userId, password) {
  if (!userId || !password) {
    return;
  }

  state.userPasswords[userId] = password;
  saveUserPasswords();
}

function getStoredUserPassword(userId) {
  return state.userPasswords[userId] || "";
}

function renderAvatarElement(element, initials) {
  if (!element) {
    return;
  }

  if (state.profilePhoto) {
    element.innerHTML = `<img src="${state.profilePhoto}" alt="" />`;
    element.classList.add("has-photo");
    return;
  }

  element.textContent = initials || "U";
  element.classList.remove("has-photo");
}

function getUserInitials(value) {
  const parts = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "U";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function renderUsers() {
  if (!elements.userList || state.profile?.role !== "admin") {
    return;
  }

  const query = elements.userSearchInput?.value.trim().toLowerCase() || "";
  const users = state.users.filter((user) => {
    const assignedRole = getAssignedCustomRole(user.id);
    const content = [user.full_name, user.email, user.role, assignedRole?.name].join(" ").toLowerCase();
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
    const assignedRole = getAssignedCustomRole(user.id);
    const accessLabel = user.role === "admin" ? "Администратор" : "Пользователь";
    row.innerHTML = `
      <td>
        <div class="user-meta">
          <strong>${escapeHtml(user.full_name || user.email)}</strong>
          <span>${user.id === state.user.id ? "Текущий аккаунт" : "Пользователь"}</span>
        </div>
      </td>
      <td>${escapeHtml(user.email)}</td>
      <td>${escapeHtml(accessLabel)}</td>
      <td>${escapeHtml(assignedRole?.name || "Не назначена")}</td>
      <td>
        <div class="user-actions">
          <button class="secondary-button user-edit-btn" type="button">Редактировать</button>
          <button class="secondary-button user-delete-btn" type="button" ${user.id === state.user.id ? "disabled" : ""}>Удалить</button>
        </div>
      </td>
    `;

    row.addEventListener("click", () => openUserProfile(user.id));
    row.querySelector(".user-edit-btn").addEventListener("click", (event) => {
      event.stopPropagation();
      openUserModal(user.id);
    });
    row.querySelector(".user-delete-btn").addEventListener("click", async (event) => {
      event.stopPropagation();
      await deleteUserFromAdmin(user.id);
    });
    elements.userList.append(row);
  });
}

function renderRoles() {
  if (!elements.roleList || state.profile?.role !== "admin") {
    return;
  }

  const query = elements.roleSearchInput?.value.trim().toLowerCase() || "";
  const roles = state.customRoles.filter((role) => {
    const content = [role.name, role.description].join(" ").toLowerCase();
    return content.includes(query);
  });

  if (roles.length === 0) {
    elements.roleList.innerHTML = `<tr><td class="user-empty" colspan="3">Ролей пока нет</td></tr>`;
    return;
  }

  elements.roleList.innerHTML = "";
  roles.forEach((role) => {
    const row = document.createElement("tr");
    row.className = "user-row";
    row.innerHTML = `
      <td>
        <div class="user-meta">
          <strong>${escapeHtml(role.name)}</strong>
          <span>${escapeHtml(role.id)}</span>
        </div>
      </td>
      <td>${escapeHtml(role.description || "Без описания")}</td>
      <td>
        <div class="user-actions">
          <button class="secondary-button role-edit-btn" type="button">Редактировать</button>
          <button class="secondary-button user-delete-btn" type="button">Удалить</button>
        </div>
      </td>
    `;

    row.querySelector(".role-edit-btn").addEventListener("click", () => openRoleModal(role.id));
    row.querySelector(".user-delete-btn").addEventListener("click", () => deleteCustomRole(role.id));
    elements.roleList.append(row);
  });
}

function populateCustomRoleSelect(select, selectedId = "") {
  if (!select) {
    return;
  }

  const options = [`<option value="">Не назначена</option>`]
    .concat(
      state.customRoles.map(
        (role) => `<option value="${escapeHtml(role.id)}" ${role.id === selectedId ? "selected" : ""}>${escapeHtml(role.name)}</option>`,
      ),
    )
    .join("");

  select.innerHTML = options;
}

function assignCustomRole(userId, roleId) {
  if (!userId) {
    return;
  }

  if (roleId) {
    state.userRoleAssignments[userId] = roleId;
  } else {
    delete state.userRoleAssignments[userId];
  }
  saveUserRoleAssignments();
}

function getAssignedCustomRoleId(userId) {
  const user = state.users.find((item) => item.id === userId);
  return user?.user_role_id || state.userRoleAssignments[userId] || "";
}

function getAssignedCustomRole(userId) {
  const user = state.users.find((item) => item.id === userId);
  if (user?.custom_role_name) {
    return {
      id: user.user_role_id,
      name: user.custom_role_name,
      description: user.custom_role_description || "",
    };
  }
  const roleId = getAssignedCustomRoleId(userId);
  return state.customRoles.find((role) => role.id === roleId) || null;
}

async function deleteCustomRole(roleId) {
  if (!confirm("Удалить роль? Назначения этой роли у пользователей будут очищены.")) {
    return;
  }

  if (state.serverMode) {
    try {
      await apiRequest(`/roles/${roleId}`, { method: "DELETE" });
      await loadRoles();
      await loadUsers();
      renderRoles();
      renderUsers();
    } catch (error) {
      alert(error.message);
    }
    return;
  }

  state.customRoles = state.customRoles.filter((role) => role.id !== roleId);
  Object.keys(state.userRoleAssignments).forEach((userId) => {
    if (state.userRoleAssignments[userId] === roleId) {
      delete state.userRoleAssignments[userId];
    }
  });
  saveCustomRoles();
  saveUserRoleAssignments();
  renderRoles();
  renderUsers();
}

function saveCustomRoles() {
  localStorage.setItem(CUSTOM_ROLES_KEY, JSON.stringify(state.customRoles));
}

function saveUserRoleAssignments() {
  localStorage.setItem(USER_ROLE_ASSIGNMENTS_KEY, JSON.stringify(state.userRoleAssignments));
}

function saveUserPasswords() {
  localStorage.setItem(USER_PASSWORDS_KEY, JSON.stringify(state.userPasswords));
}

function loadCustomRoles() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CUSTOM_ROLES_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error(error);
    return [];
  }
}

function loadUserRoleAssignments() {
  try {
    const parsed = JSON.parse(localStorage.getItem(USER_ROLE_ASSIGNMENTS_KEY) || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    console.error(error);
    return {};
  }
}

function loadUserPasswords() {
  try {
    const parsed = JSON.parse(localStorage.getItem(USER_PASSWORDS_KEY) || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    console.error(error);
    return {};
  }
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
    elements.tableBody.innerHTML = `<tr class="empty-row"><td colspan="7">Проектов пока нет</td></tr>`;
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
    `;
    row.addEventListener("click", () => openProject(project.id));
    row.querySelector(".project-select").addEventListener("click", (event) => {
      event.stopPropagation();

      if (event.target.checked) {
        state.selectedIds.add(project.id);
      } else {
        state.selectedIds.delete(project.id);
      }
      renderProjectTable();
    });
    elements.tableBody.append(row);
  });
}

function renderTrashTableLegacy() {
  if (!elements.trashTableBody) {
    return;
  }

  if (state.trashProjects.length === 0) {
    elements.trashTableBody.innerHTML = `<tr class="empty-row"><td colspan="6">Корзина пуста</td></tr>`;
    return;
  }

  elements.trashTableBody.innerHTML = "";
  state.trashProjects.forEach((project) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${escapeHtml(project.projectKey || project.id || "-")}</td>
      <td>${escapeHtml(project.title || "Без названия")}</td>
      <td>${formatDate(project.createdAt)}</td>
      <td>${formatDate(project.deletedAt)}</td>
      <td>${escapeHtml(project.responsible || "Не назначен")}</td>
      <td><button class="secondary-button restore-project-btn" type="button">Восстановить</button></td>
    `;
    row.querySelector(".restore-project-btn").addEventListener("click", () => restoreProject(project.id));
    elements.trashTableBody.append(row);
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

  renderResponsibleOptions(project);
  fields.forEach((field) => {
    const input = document.querySelector(`#${field}`);
    input.value = project[field] || "";
  });
  elements.statusPickerText.textContent = project.status || "Выбрать статус";

  renderSections(project);
}

function renderResponsibleOptions(project) {
  const select = document.querySelector("#responsible");
  if (!select) {
    return;
  }

  const currentValue = project?.responsible || "";
  const options = [`<option value="">Не назначен</option>`];
  state.users.forEach((user) => {
    const name = user.full_name || user.email || "Пользователь";
    const assignedRole = getAssignedCustomRole(user.id);
    const accessLabel = user.role === "admin" ? "Администратор" : "Пользователь";
    const roleText = assignedRole?.name ? `${assignedRole.name}, ${accessLabel}` : accessLabel;
    options.push(`<option value="${escapeHtml(name)}">${escapeHtml(name)} — ${escapeHtml(roleText)}</option>`);
  });

  if (currentValue && !state.users.some((user) => (user.full_name || user.email) === currentValue)) {
    options.push(`<option value="${escapeHtml(currentValue)}">${escapeHtml(currentValue)}</option>`);
  }

  select.innerHTML = options.join("");
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
            <div class="inline-file-count">${escapeHtml(getInlineFileCountText(files, item.type))}</div>
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
    <div class="inline-media-grid">
      ${files.map((file) => renderMediaPreview(file)).join("")}
    </div>
  `;
}

function getInlineFileCountText(files, type) {
  if (files.length === 0) {
    return type === "documents" ? "Документы не загружены" : "Материалы не загружены";
  }

  const label = type === "documents" ? "Загружено документов" : "Загружено материалов";
  return `${label}: ${files.length}`;
}

function renderMediaPreview(file) {
  const fileUrl = getFileViewUrl(file);
  const isImage = file.type?.startsWith("image/");

  return `
    <a class="inline-media-preview" href="${fileUrl}" target="_blank" rel="noreferrer">
      <span class="inline-media-thumb">
        ${isImage ? `<img src="${fileUrl}" alt="${escapeHtml(file.name)}" />` : `<span>${escapeHtml(getFileKindLabel(file))}</span>`}
      </span>
      <span class="inline-media-name">${escapeHtml(file.name)}</span>
    </a>
  `;
}

function renderDocumentPreview(file) {
  const fileUrl = getFileViewUrl(file);
  const canPreview = canPreviewInline(file);

  return `
    <div class="document-preview">
      <div class="document-preview-frame">
        ${
          canPreview
            ? `<iframe src="${fileUrl}" title="${escapeHtml(file.name)}"></iframe>`
            : `<a href="${fileUrl}" target="_blank" rel="noreferrer">Открыть документ</a>`
        }
      </div>
      <a class="document-preview-name" href="${fileUrl}" target="_blank" rel="noreferrer">${escapeHtml(getFileKindLabel(file))}: ${escapeHtml(file.name)}</a>
    </div>
  `;
}

function getFileKindLabel(file) {
  const name = (file.name || "").toLowerCase();

  if (file.type === "application/pdf" || name.endsWith(".pdf")) return "PDF";
  if (name.endsWith(".doc") || name.endsWith(".docx")) return "WORD";
  if (name.endsWith(".xls") || name.endsWith(".xlsx")) return "EXCEL";
  if (name.endsWith(".ppt") || name.endsWith(".pptx")) return "PPT";
  if (file.type?.startsWith("image/")) return "IMG";
  if (file.type?.startsWith("video/")) return "VIDEO";
  return "FILE";
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
  elements.paramModal.classList.add("file-modal");
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
  elements.paramModal.classList.add("file-modal");
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
  elements.paramModal.classList.remove("file-modal");
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

function renderImagesLegacy(project) {
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

function renderDocumentsLegacy(project) {
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

function getFileViewUrl(file) {
  if (file.dataUrl) {
    return file.dataUrl;
  }

  if (file.viewUrl) {
    return file.viewUrl;
  }

  if (file.id && state.serverMode) {
    return `${apiBaseUrl}/files/${file.id}/view?token=${encodeURIComponent(state.apiToken)}`;
  }

  return getFileUrl(file);
}

function getFileDownloadUrl(file) {
  if (file.dataUrl) {
    return file.dataUrl;
  }

  if (file.downloadUrl) {
    return file.downloadUrl;
  }

  if (file.url) {
    return file.url;
  }

  return getFileViewUrl(file);
}

function getFileTextUrl(file) {
  if (file.textUrl) {
    return file.textUrl;
  }

  if (file.id && state.serverMode) {
    return `${apiBaseUrl}/files/${file.id}/text?token=${encodeURIComponent(state.apiToken)}`;
  }

  return "";
}

function getFilePdfPreviewUrl(file) {
  if (file.pdfPreviewUrl) {
    return file.pdfPreviewUrl;
  }

  if (file.id && state.serverMode) {
    return `${apiBaseUrl}/files/${file.id}/preview?token=${encodeURIComponent(state.apiToken)}`;
  }

  return "";
}

function getFileHtmlPreviewUrl(file) {
  if (file.htmlPreviewUrl) {
    return file.htmlPreviewUrl;
  }

  if (file.id && state.serverMode) {
    return `${apiBaseUrl}/files/${file.id}/html?token=${encodeURIComponent(state.apiToken)}`;
  }

  return "";
}

function canPreviewInline(file) {
  const type = file.type || "";

  return type.startsWith("image/") || type.startsWith("video/");
}

function canPreviewAsOriginalDocument(file) {
  const type = file.type || "";
  const name = (file.name || "").toLowerCase();

  return (
    name.endsWith(".doc") ||
    name.endsWith(".docx") ||
    name.endsWith(".rtf") ||
    name.endsWith(".odt") ||
    name.endsWith(".xls") ||
    name.endsWith(".xlsx") ||
    name.endsWith(".ods") ||
    name.endsWith(".ppt") ||
    name.endsWith(".pptx") ||
    name.endsWith(".odp") ||
    name.endsWith(".pdf") ||
    type.includes("word") ||
    type.includes("excel") ||
    type.includes("powerpoint") ||
    type.includes("pdf")
  );
}

function canPreviewAsText(file) {
  const type = file.type || "";
  const name = (file.name || "").toLowerCase();

  return (
    type.startsWith("text/") ||
    type === "application/json" ||
    name.endsWith(".txt") ||
    name.endsWith(".csv") ||
    name.endsWith(".json")
  );
}

async function openFilePreview(file) {
  const url = getFileViewUrl(file);
  if (!url || url === "#") {
    return;
  }

  if (!elements.filePreviewModal || !elements.filePreviewBody) {
    return;
  }

  const type = file.type || "";
  const name = file.name || "Файл";
  const fileKind = getFileKindLabel(file);
  let previewHtml = "";

  elements.filePreviewType.textContent = fileKind;
  elements.filePreviewTitle.textContent = name;
  elements.filePreviewBody.innerHTML = `<div class="file-preview-loading">Загрузка предпросмотра...</div>`;
  elements.filePreviewModal.hidden = false;

  if (type.startsWith("image/")) {
    previewHtml = `<img class="file-preview-media" src="${url}" alt="${escapeHtml(name)}" />`;
  } else if (type.startsWith("video/")) {
    previewHtml = `<video class="file-preview-media" src="${url}" controls autoplay></video>`;
  } else if (canPreviewAsOriginalDocument(file)) {
    if (!state.serverMode) {
      previewHtml = `
        <div class="file-preview-fallback">
          <strong>${escapeHtml(fileKind)}: ${escapeHtml(name)}</strong>
          <p>Чтобы видеть документ как оригинал внутри сайта, файл должен быть загружен через backend, а на backend должен быть установлен LibreOffice.</p>
        </div>
      `;
    } else {
    const data = await apiRequest(`/files/${file.id}/html`).catch((error) => ({ error: error.message }));
    previewHtml = data.html
      ? `<iframe class="file-preview-frame" sandbox="allow-same-origin" srcdoc="${escapeHtml(data.html)}" title="${escapeHtml(name)}"></iframe>`
      : `
          <div class="file-preview-fallback">
            <strong>${escapeHtml(fileKind)}: ${escapeHtml(name)}</strong>
            <p>${escapeHtml(data.error || "Не удалось подготовить оригинальный предпросмотр документа.")}</p>
          </div>
        `;
    }
  } else if (canPreviewInline(file)) {
    previewHtml = `<iframe class="file-preview-frame" src="${url}" title="${escapeHtml(name)}"></iframe>`;
  } else if (canPreviewAsText(file)) {
    try {
      const textUrl = getFileTextUrl(file);
      let text = "";

      if (textUrl) {
        const data = await apiRequest(`/files/${file.id}/text`);
        text = data.text || "";
      } else {
        const response = await fetch(url);
        const rawText = await response.text();
        text = name.toLowerCase().endsWith(".rtf") || type.includes("rtf") ? rtfToPlainText(rawText) : rawText;
      }

      previewHtml = `<article class="file-preview-document"><pre class="file-preview-text">${escapeHtml(text || "Файл пустой.")}</pre></article>`;
    } catch (error) {
      console.error(error);
      previewHtml = `<div class="file-preview-fallback"><strong>${escapeHtml(fileKind)}: ${escapeHtml(name)}</strong><p>Не удалось открыть предпросмотр файла на сайте.</p></div>`;
    }
  } else {
    previewHtml = `
      <div class="file-preview-fallback">
        <strong>${escapeHtml(fileKind)}: ${escapeHtml(name)}</strong>
        <p>Файл сохранён в системе. Этот формат браузер не показывает напрямую внутри сайта без отдельного конвертера.</p>
      </div>
    `;
  }

  elements.filePreviewBody.innerHTML = previewHtml;
}

function rtfToPlainText(value) {
  return String(value || "")
    .replace(/\\par[d]?/g, "\n")
    .replace(/\\tab/g, "\t")
    .replace(/\\'[0-9a-fA-F]{2}/g, "")
    .replace(/\\[a-zA-Z]+\d* ?/g, "")
    .replace(/[{}]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function closeFilePreview() {
  if (!elements.filePreviewModal || !elements.filePreviewBody) {
    return;
  }

  elements.filePreviewModal.hidden = true;
  elements.filePreviewBody.innerHTML = "";
}

function renderImages(project) {
  if (!elements.imageGrid) {
    return;
  }

  elements.imageGrid.innerHTML = "";
  const images = state.currentFileItem ? getItemFiles(project, state.currentFileItem) : project.images;

  if (images.length === 0) {
    elements.imageGrid.innerHTML = `<div class="empty-state"><p>Материалы пока не добавлены.</p></div>`;
    return;
  }

  images.forEach((image) => {
    const tile = document.createElement("div");
    const isVideo = image.type?.startsWith("video/");
    const fileUrl = getFileViewUrl(image);

    tile.className = "image-tile";
    tile.innerHTML = `
      <button class="file-preview-button" type="button" aria-label="Открыть файл">
        ${
          isVideo
            ? `<video src="${fileUrl}" controls></video>`
            : `<img src="${fileUrl}" alt="${escapeHtml(image.name)}" />`
        }
        <span class="file-preview-caption">${escapeHtml(image.name)}</span>
      </button>
      <a class="file-open-chip" href="${fileUrl}" target="_blank" rel="noreferrer">Открыть</a>
      <button class="icon-button" type="button" aria-label="Удалить файл">×</button>
    `;

    tile.querySelector(".file-preview-button").addEventListener("click", () => openFilePreview(image));
    tile.querySelector(".file-open-chip")?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openFilePreview(image);
    });
    tile.querySelector(".icon-button").addEventListener("click", async (event) => {
      event.stopPropagation();
      await deleteFile(project, image);
      renderImages(project);
    });
    elements.imageGrid.append(tile);
  });
}

function renderDocuments(project) {
  if (!elements.documentList) {
    return;
  }

  elements.documentList.innerHTML = "";
  const documents = state.currentFileItem ? getItemFiles(project, state.currentFileItem) : project.documents;

  if (documents.length === 0) {
    elements.documentList.innerHTML = `<div class="empty-state"><p>Файлы пока не добавлены.</p></div>`;
    return;
  }

  documents.forEach((documentItem) => {
    const row = document.createElement("div");
    const fileUrl = getFileViewUrl(documentItem);

    row.className = "file-row";
    row.innerHTML = `
      <button class="file-link-button" type="button">${escapeHtml(documentItem.name)}</button>
      <span>${formatFileSize(documentItem.size)}</span>
      <a class="secondary-button" href="${fileUrl}" target="_blank" rel="noreferrer">Открыть</a>
      <button class="secondary-button danger" type="button">Удалить</button>
    `;

    row.querySelector(".file-link-button").addEventListener("click", () => openFilePreview(documentItem));
    row.querySelector("a.secondary-button")?.addEventListener("click", (event) => {
      event.preventDefault();
      openFilePreview(documentItem);
    });
    row.querySelector(".danger").addEventListener("click", async () => {
      await deleteFile(project, documentItem);
      renderDocuments(project);
    });
    elements.documentList.append(row);
  });
}

function createProject() {
  const now = new Date().toISOString();

  return {
    id: createId(),
    projectKey: "",
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
    deletedAt: "",
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
    state.projects = await loadServerProjects();
    state.trashProjects = await loadServerTrashProjects();
  } else {
    const deletedAt = new Date().toISOString();
    const movingToTrash = state.projects
      .filter((project) => ids.includes(project.id))
      .map((project) => ({
        ...project,
        deletedAt,
        deletedBy: state.user?.id || "",
        deletedByName: state.user?.full_name || state.user?.email || "",
        deletedByEmail: state.user?.email || "",
      }));
    state.trashProjects = [...movingToTrash, ...state.trashProjects];
    state.projects = state.projects.filter((project) => !ids.includes(project.id));
    saveLocalProjects();
    saveLocalTrashProjects();
  }

  state.selectedIds.clear();
  state.deleteMode = false;
  state.activeId = state.projects[0]?.id || null;
  state.view = "registry";

  render();
}

async function restoreProject(projectId) {
  if (!projectId) {
    return;
  }

  if (state.serverMode) {
    await apiRequest(`/projects/${projectId}/restore`, { method: "POST" });
    state.projects = await loadServerProjects();
    state.trashProjects = await loadServerTrashProjects();
  } else {
    const project = state.trashProjects.find((item) => item.id === projectId);
    if (!project) {
      return;
    }
    state.trashProjects = state.trashProjects.filter((item) => item.id !== projectId);
    state.projects.unshift({
      ...project,
      deletedAt: "",
      deletedBy: "",
      deletedByName: "",
      deletedByEmail: "",
    });
    saveLocalProjects();
    saveLocalTrashProjects();
  }

  state.activeId = state.projects[0]?.id || null;
  render();
}

async function clearTrash() {
  if (state.trashProjects.length === 0) {
    alert("Корзина уже пуста.");
    return;
  }

  if (!canDeleteProjects()) {
    alert("Очистить корзину может только администратор.");
    return;
  }

  if (!confirm("Очистить корзину? Удалённые проекты будут удалены окончательно.")) {
    return;
  }

  if (state.serverMode) {
    await apiRequest("/projects/trash/clear/all", { method: "DELETE" });
    state.trashProjects = await loadServerTrashProjects();
    state.projects = await loadServerProjects();
  } else {
    state.trashProjects = [];
    saveLocalTrashProjects();
  }

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

function loadLocalTrashProjects() {
  try {
    return (JSON.parse(localStorage.getItem(TRASH_STORAGE_KEY)) || []).map(normalizeProject);
  } catch {
    return [];
  }
}

function saveLocalTrashProjects() {
  if (state.serverMode) {
    return;
  }

  try {
    localStorage.setItem(TRASH_STORAGE_KEY, JSON.stringify(state.trashProjects));
  } catch {
    alert("Браузер не смог сохранить корзину проектов.");
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
    projectKey: project.projectKey || project.project_key || "",
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
    projectKey: project.project_key || project.projectKey || "",
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
    deletedAt: project.deleted_at || project.deletedAt || "",
    deletedBy: project.deleted_by || project.deletedBy || "",
    deletedByName: project.deleted_by_name || project.deletedByName || "",
    deletedByEmail: project.deleted_by_email || project.deletedByEmail || "",
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
    url: `${apiBaseUrl}/files/${file.id}/view?token=${encodeURIComponent(state.apiToken)}`,
    viewUrl: `${apiBaseUrl}/files/${file.id}/view?token=${encodeURIComponent(state.apiToken)}`,
    textUrl: `${apiBaseUrl}/files/${file.id}/text?token=${encodeURIComponent(state.apiToken)}`,
    pdfPreviewUrl: `${apiBaseUrl}/files/${file.id}/preview?token=${encodeURIComponent(state.apiToken)}`,
    htmlPreviewUrl: `${apiBaseUrl}/files/${file.id}/html?token=${encodeURIComponent(state.apiToken)}`,
    downloadUrl: `${apiBaseUrl}/files/${file.id}/download?token=${encodeURIComponent(state.apiToken)}`,
    addedAt: file.created_at,
  };
}

function renderTrashTable() {
  if (!elements.trashTableBody) {
    return;
  }

  if (state.trashProjects.length === 0) {
    elements.trashTableBody.innerHTML = `<tr class="empty-row"><td colspan="7">Корзина пуста</td></tr>`;
    return;
  }

  elements.trashTableBody.innerHTML = "";
  state.trashProjects.forEach((project) => {
    const deletedBy = project.deletedByName || project.deletedByEmail || project.deletedBy || "Не указано";
    const restoreButton = canDeleteProjects()
      ? `<button class="secondary-button restore-project-btn" type="button">Восстановить</button>`
      : `<span class="muted-action">Только просмотр</span>`;
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${escapeHtml(project.projectKey || project.id || "-")}</td>
      <td>${escapeHtml(project.title || "Без названия")}</td>
      <td>${formatDate(project.createdAt)}</td>
      <td>${formatDate(project.deletedAt)}</td>
      <td>${escapeHtml(deletedBy)}</td>
      <td>${escapeHtml(project.responsible || "Не назначен")}</td>
      <td>${restoreButton}</td>
    `;

    row.querySelector(".restore-project-btn")?.addEventListener("click", () => restoreProject(project.id));
    elements.trashTableBody.append(row);
  });
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
