const STORAGE_KEY = "landProjects.v1";

const config = window.SUPABASE_CONFIG || {};
const isSupabaseConfigured =
  Boolean(config.url) &&
  Boolean(config.anonKey) &&
  !config.url.includes("PASTE_") &&
  !config.anonKey.includes("PASTE_") &&
  window.supabase;
const supabaseClient = isSupabaseConfigured ? window.supabase.createClient(config.url, config.anonKey) : null;
const storageBucket = config.storageBucket || "land-project-files";

const state = {
  projects: [],
  activeId: null,
  selectedIds: new Set(),
  deleteMode: false,
  view: "registry",
  user: null,
  cloudMode: false,
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
};

const elements = {
  authPanel: document.querySelector("#authPanel"),
  authForm: document.querySelector("#authForm"),
  authEmail: document.querySelector("#authEmail"),
  authPassword: document.querySelector("#authPassword"),
  cloudStatus: document.querySelector("#cloudStatus"),
  signUpBtn: document.querySelector("#signUpBtn"),
  signOutBtn: document.querySelector("#signOutBtn"),
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
      ["Адрес / локация", "Регион, район, ближайший н.п.", true],
      ["Площадь, га", "Общая и пригодная к освоению", true],
      ["GPS-координаты", "Точка входа + полигон границ", true, false, "map"],
      ["Категория земли", "Сельхоз / промышл. / турист. и др.", true],
      ["Целевое назначение", "По документам и фактически", true],
    ],
  },
  {
    title: "2. Цель и формат сделки",
    subtitle: "Намерения стороны, предлагающей участок",
    items: [
      ["Тип сделки", "Продажа / аренда / партнёрство / СП", true],
      ["Запрашиваемая цена", "За участок / за га / условия", true],
      ["Ожидания партнёра", "Доля, роль, вклад в проект", true],
      ["Сроки", "Готовность к сделке, дедлайны", true],
    ],
  },
  {
    title: "3. Правовые документы",
    subtitle: "Юридическая чистота и статус прав",
    items: [
      ["Документы и файлы", "Загрузка и просмотр всех документов участка", true, false, "documents"],
      ["Акт на землю (госакт)", "Право собственности или аренды", true],
      ["Правоустанавливающий документ", "Основание возникновения права"],
      ["Кадастровый паспорт / план", "Межевание, план участка"],
      ["Обременения / ограничения", "Залог, арест, сервитут, охр. зоны"],
      ["Разрешение на использование", "РНИ, ТЭО, ПДП при наличии"],
      ["Данные собственника", "ФЛ / ЮЛ, БИН/ИИН, история"],
    ],
  },
  {
    title: "4. Контактная информация",
    subtitle: "Со стороны предложившего участок",
    items: [
      ["Имя контактного лица", "Собственник / брокер / представитель", true],
      ["Телефон / мессенджер", "WhatsApp, Telegram предпочтительно", true],
      ["Email", "Для документооборота", true],
      ["Организация / роль", "Если юридическое лицо", true],
    ],
  },
  {
    title: "5. Визуальные материалы",
    subtitle: "Фото, видео, схемы",
    items: [
      ["Фото участка", "Общий вид, рельеф, въезд, периметр", true, false, "images"],
      ["Аэросъёмка / спутник", "Google Maps, 2GIS, дрон при наличии"],
      ["Схема участка / ситуационный план", "Привязка к окружению, дорогам"],
      ["Видеообзор", "Проезд, панорама, состояние", false, true],
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
const statusPhases = [
  {
    phase: "Фаза 1 — Входящая заявка",
    statuses: [
      ["Новая заявка", "Участок поступил — телефон, мессенджер, рекомендация. Минимум данных: локация, площадь, контакт.", "Входящий"],
      ["Сбор информации", "Запрашиваем документы, фото, координаты. Заполняем карточку объекта до минимального порога.", "В работе"],
      ["Первичный скрининг", "Десктоп-анализ: карты, спутник, кадастр, обременения. Оценка соответствия нашим критериям входа.", "Анализ"],
    ],
  },
  {
    phase: "Фаза 2 — Полевая оценка",
    statuses: [
      ["Выезд запланирован", "Дата выезда согласована. Назначена команда: кто едет, что проверяет. Чек-лист выезда готов.", "Запланировано"],
      ["Выезд выполнен", "Полевая инспекция проведена. Заполнен протокол: инфраструктура, рельеф, состояние дорог, фото/видео.", "Завершён"],
      ["Внутренняя оценка", "Командное обсуждение. Оцениваем потенциал, capex входа, риски, соответствие стратегии ZOLO/KIT.", "Решение"],
    ],
  },
  {
    phase: "Фаза 3 — Коммерческое согласование",
    statuses: [
      ["Интерес подтверждён", "Команда приняла решение двигаться. Собственнику направлено намерение о переговорах.", "Активно"],
      ["Переговоры по условиям", "Обсуждаем цену, формат сделки, долю, этапность платежей, обязательства сторон.", "Переговоры"],
      ["Условия согласованы", "Term sheet или протокол о намерениях подписан. Ключевые параметры зафиксированы письменно.", "Согласовано"],
      ["Due diligence", "Юридическая проверка: чистота прав, отсутствие обременений, налоговые задолженности, история переходов права.", "Проверка"],
    ],
  },
  {
    phase: "Фаза 4 — Юридическое оформление",
    statuses: [
      ["Подготовка договора", "Юрист готовит проект договора. Согласование редакций между сторонами.", "Подготовка"],
      ["Согласование договора", "Правки, протоколы разногласий. Финальная редакция утверждена обеими сторонами.", "Согласование"],
      ["Нотариальное удостоверение", "Договор удостоверяется нотариусом. При необходимости — оценка, ГАСК, разрешения акимата.", "У нотариуса"],
      ["Государственная регистрация", "Подача в ЦОН / ЕНИС. Регистрация перехода права. Получение выписки из реестра.", "Регистрация"],
    ],
  },
  {
    phase: "Финальные статусы",
    statuses: [
      ["Сделка закрыта", "Право зарегистрировано, расчёты завершены. Участок переходит в портфель / разработку концепции.", "Закрыто"],
      ["Отклонено", "Не прошёл скрининг, выезд или DD. Причина зафиксирована.", "Отказ"],
      ["Заморожено", "Потенциал есть, но сейчас не приоритет. Дата повторного рассмотрения установлена.", "Пауза"],
      ["Сделка сорвалась", "На этапе договора или регистрации. Причина: риски правовые, финансовые, позиция собственника.", "Сорвалась"],
    ],
  },
];

init();

async function init() {
  bindEvents();

  if (supabaseClient) {
    const { data } = await supabaseClient.auth.getSession();
    state.user = data.session?.user || null;
    state.cloudMode = Boolean(state.user);

    supabaseClient.auth.onAuthStateChange(async (_event, session) => {
      state.user = session?.user || null;
      state.cloudMode = Boolean(state.user);
      await loadInitialProjects();
      updateAuthState();
      render();
    });
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

  elements.signUpBtn?.addEventListener("click", signUp);
  elements.signOutBtn?.addEventListener("click", signOut);

  elements.newProjectBtn.addEventListener("click", () => {
    const project = createProject();
    state.projects.unshift(project);
    state.activeId = null;
    state.deleteMode = false;
    state.selectedIds.clear();
    state.map.mode = "move";
    elements.search.value = "";
    saveLocalProjects();
    renderProjectTable();
    persistProject(project).catch((error) => {
      console.error(error);
      alert("Проект добавлен в таблицу, но пока не сохранился в облако. Проверьте подключение Supabase.");
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
    if (!state.deleteMode) {
      state.deleteMode = true;
      state.selectedIds.clear();
      renderProjectTable();
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
  if (!supabaseClient) {
    alert("Supabase еще не настроен. Вставьте URL и anon key в supabase-config.js.");
    return;
  }

  const { error } = await supabaseClient.auth.signInWithPassword({
    email: elements.authEmail.value.trim(),
    password: elements.authPassword.value,
  });

  if (error) {
    alert(error.message);
  }
}

async function signUp() {
  if (!supabaseClient) {
    alert("Supabase еще не настроен. Вставьте URL и anon key в supabase-config.js.");
    return;
  }

  const { error } = await supabaseClient.auth.signUp({
    email: elements.authEmail.value.trim(),
    password: elements.authPassword.value,
  });

  if (error) {
    alert(error.message);
    return;
  }

  alert("Аккаунт создан. Если в Supabase включено подтверждение email, подтвердите почту и войдите.");
}

async function signOut() {
  if (supabaseClient) {
    await supabaseClient.auth.signOut();
  }
}

function updateAuthState() {
  if (!supabaseClient) {
    if (elements.cloudStatus) {
      elements.cloudStatus.textContent = "Локальный режим: Supabase не настроен, данные видны только в этом браузере.";
    }
    if (elements.signOutBtn) {
      elements.signOutBtn.hidden = true;
    }
    return;
  }

  if (state.user) {
    if (elements.cloudStatus) {
      elements.cloudStatus.textContent = `Облачный режим: вход выполнен как ${state.user.email}.`;
    }
    if (elements.signOutBtn) {
      elements.signOutBtn.hidden = false;
    }
    if (elements.authEmail) {
      elements.authEmail.value = state.user.email || "";
    }
    return;
  }

  if (elements.cloudStatus) {
    elements.cloudStatus.textContent = "Supabase настроен. Войдите, чтобы работать с общей базой и файлами.";
  }
  if (elements.signOutBtn) {
    elements.signOutBtn.hidden = true;
  }
}

async function loadInitialProjects() {
  state.projects = state.cloudMode ? await loadCloudProjects() : loadLocalProjects();
  state.activeId = state.projects[0]?.id || null;
}

async function loadCloudProjects() {
  const { data: projects, error } = await supabaseClient
    .from("land_projects")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    alert(`Не удалось загрузить проекты: ${error.message}`);
    return [];
  }

  const { data: files, error: filesError } = await supabaseClient
    .from("land_project_files")
    .select("*")
    .order("created_at", { ascending: false });

  if (filesError) {
    alert(`Не удалось загрузить файлы: ${filesError.message}`);
  }

  const mappedProjects = projects.map((project) => fromDbProject(project, files || []));
  await attachSignedUrls(mappedProjects);

  return mappedProjects;
}

function render() {
  elements.registryView.hidden = state.view !== "registry";
  elements.detailView.hidden = state.view !== "detail";
  renderProjectTable();

  if (state.view === "detail") {
    renderForm();
  }
}

function renderProjectTable() {
  const query = elements.search.value.trim().toLowerCase();
  const filteredProjects = state.projects.filter((project) => {
    const content = [project.title, project.address, project.status, project.responsible, project.area].join(" ").toLowerCase();
    return content.includes(query);
  });

  elements.tableBody.innerHTML = "";
  elements.projectTable?.classList.toggle("is-delete-mode", state.deleteMode);
  elements.deleteSelectedBtn.textContent = state.deleteMode ? "Удалить выбранные" : "Удалить";
  if (elements.cancelDeleteBtn) {
    elements.cancelDeleteBtn.hidden = !state.deleteMode;
  }

  if (filteredProjects.length === 0) {
    elements.tableBody.innerHTML = `<tr class="empty-row"><td colspan="8">Проектов пока нет</td></tr>`;
    return;
  }

  filteredProjects.forEach((project) => {
    const row = document.createElement("tr");
    row.className = project.id === state.activeId ? "is-active" : "";
    row.innerHTML = `
      <td class="select-col"><input class="project-select" type="checkbox" ${state.selectedIds.has(project.id) ? "checked" : ""} ${state.deleteMode ? "" : "disabled"} aria-label="Выбрать проект" /></td>
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

      if (!state.deleteMode) {
        return;
      }

      if (event.target.checked) {
        state.selectedIds.add(project.id);
      } else {
        state.selectedIds.delete(project.id);
      }
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

      item.value = input.value;
      input.closest("tr").classList.toggle("is-filled", Boolean(item.value.trim()));
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
}

function renderParamRow(project, item, sectionIndex, itemIndex) {
  const filled = isParamFilled(project, item);
  const badges = `
    ${item.required ? `<span class="required-mark" title="Обязательное поле">*</span>` : ""}
    ${item.optional ? `<span class="mini-badge opt">опц.</span>` : ""}
  `;

  if (item.type === "map" || item.type === "images" || item.type === "documents") {
    if (item.type === "images" || item.type === "documents") {
      return `
        <tr class="${filled ? "is-filled" : ""}">
          <td>
            <div class="param-name-cell">
              <strong>${escapeHtml(item.label)} ${badges}</strong>
              <span>${escapeHtml(item.note || "")}</span>
            </div>
          </td>
          <td>
            <div class="param-combo">
              <textarea data-param-input data-section-index="${sectionIndex}" data-item-index="${itemIndex}" rows="2" placeholder="Заполните описание вручную">${escapeHtml(item.value || "")}</textarea>
              <button class="secondary-button param-action-button" data-param-action="${item.type}" data-section-index="${sectionIndex}" data-item-index="${itemIndex}" type="button">
                ${escapeHtml(getParamActionText(project, item))}
              </button>
            </div>
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
          <button class="secondary-button param-action-button" data-param-action="${item.type}" data-section-index="${sectionIndex}" data-item-index="${itemIndex}" type="button">
            ${escapeHtml(getParamActionText(project, item))}
          </button>
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

function getParamActionText(project, item) {
  if (item.type === "map") {
    return (project.areaPoints || []).length > 0 ? "Открыть карту - границы указаны" : "Открыть карту";
  }

  if (item.type === "images") {
    return (project.images || []).length > 0 ? `Открыть фото (${project.images.length})` : "Добавить фото";
  }

  if (item.type === "documents") {
    return (project.documents || []).length > 0 ? `Открыть документы (${project.documents.length})` : "Добавить документы";
  }

  return "Открыть";
}

function isParamFilled(project, item) {
  if (item.type === "map") {
    return (project.areaPoints || []).length > 0 || Boolean(project.lat && project.lng);
  }

  if (item.type === "images") {
    return (project.images || []).length > 0;
  }

  if (item.type === "documents") {
    return (project.documents || []).length > 0;
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
    document.querySelector("#area").value = "";
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

    if (activeProject.lat && activeProject.lng) {
      state.map.centerLat = Number(activeProject.lat);
      state.map.centerLng = Number(activeProject.lng);
      state.map.mode = "move";
    }

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
    document.querySelector("#area").value = "";
    return;
  }

  const squareMeters = calculatePolygonArea(points);
  project.areaSquareMeters = Math.round(squareMeters);
  project.area = formatArea(squareMeters);
  setProjectMarkerToAreaCenter(project);
  document.querySelector("#area").value = project.area;
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
  elements.drawAreaBtn.classList.toggle("is-active", state.map.mode === "draw");
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

    phase.statuses.forEach(([name, description, badge], statusIndex) => {
      const option = document.createElement("button");
      option.className = `status-dropdown-option${activeProject.status === name ? " is-selected" : ""}`;
      option.type = "button";
      option.innerHTML = `
        <span class="status-check">${activeProject.status === name ? "✓" : ""}</span>
        <span class="status-body">
          <strong>${escapeHtml(name)}</strong>
          <small>${escapeHtml(description)}</small>
        </span>
        <span class="status-choice-badge">${escapeHtml(badge)}</span>
      `;
      option.addEventListener("click", async () => {
        activeProject.status = badge;
        activeProject.statusName = name;
        activeProject.statusDescription = description;
        activeProject.statusBadge = badge;
        activeProject.updatedAt = new Date().toISOString();
        document.querySelector("#status").value = badge;
        elements.statusPickerText.textContent = badge;
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

  if (project.images.length === 0) {
    elements.imageGrid.innerHTML = `<div class="empty-state"><p>Фото пока не добавлены.</p></div>`;
    return;
  }

  project.images.forEach((image) => {
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

  if (project.documents.length === 0) {
    elements.documentList.innerHTML = `<div class="empty-state"><p>Файлы пока не добавлены.</p></div>`;
    return;
  }

  project.documents.forEach((documentItem) => {
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

  if (state.cloudMode) {
    const uploadedFiles = [];

    for (const file of files) {
      uploadedFiles.push(await uploadCloudFile(project, file, kind));
    }

    if (kind === "image") {
      project.images.push(...uploadedFiles);
      renderImages(project);
    } else {
      project.documents.push(...uploadedFiles);
      renderDocuments(project);
    }
  } else {
    const savedFiles = await Promise.all(files.map((file) => fileToStoredObject(file, kind)));

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

async function uploadCloudFile(project, file, kind) {
  await persistProject(project);

  const storagePath = `${project.id}/${kind}/${createId()}-${sanitizeFileName(file.name)}`;
  const { error: uploadError } = await supabaseClient.storage.from(storageBucket).upload(storagePath, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  if (uploadError) {
    alert(`Не удалось загрузить файл: ${uploadError.message}`);
    throw uploadError;
  }

  const payload = {
    project_id: project.id,
    kind,
    name: file.name,
    size: file.size,
    type: file.type || "",
    storage_path: storagePath,
    created_by: state.user.id,
  };
  const { data, error } = await supabaseClient.from("land_project_files").insert(payload).select("*").single();

  if (error) {
    alert(`Файл загрузился, но запись не сохранилась: ${error.message}`);
    throw error;
  }

  const savedFile = fromDbFile(data);
  savedFile.url = await createSignedFileUrl(savedFile.storagePath);

  return savedFile;
}

async function deleteFile(project, file) {
  const targetList = file.kind === "image" ? project.images : project.documents;
  const index = targetList.findIndex((item) => item.id === file.id);

  if (index >= 0) {
    targetList.splice(index, 1);
  }

  if (state.cloudMode && file.storagePath) {
    await supabaseClient.storage.from(storageBucket).remove([file.storagePath]);
    await supabaseClient.from("land_project_files").delete().eq("id", file.id);
  } else {
    saveLocalProjects();
  }

  renderSections(project);
}

function fileToStoredObject(file, kind) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve({
        id: createId(),
        kind,
        name: file.name,
        size: file.size,
        type: file.type,
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
    const existingSection = existingSections.find((section) => section.title === template.title) || existingSections[sectionIndex] || {};
    const existingItems = Array.isArray(existingSection.items) ? existingSection.items : [];

    return {
      title: template.title,
      subtitle: template.subtitle,
      items: template.items.map(([label, note, required, optional, type], itemIndex) => {
        const existingItem =
          existingItems.find((item) => typeof item === "object" && item.label === label) ||
          existingItems[itemIndex] ||
          {};

        return {
          label,
          note,
          required: Boolean(required),
          optional: Boolean(optional),
          type: type || "text",
          value: typeof existingItem === "object" ? existingItem.value || "" : "",
        };
      }),
    };
  });
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

  if (!state.cloudMode) {
    saveLocalProjects();
    return;
  }

  const { error } = await supabaseClient.from("land_projects").upsert(toDbProject(project), {
    onConflict: "id",
  });

  if (error) {
    alert(`Не удалось сохранить проект: ${error.message}`);
  }
}

async function deleteProjects(projectIds) {
  const ids = projectIds.filter(Boolean);

  if (ids.length === 0) {
    alert("Выберите один или несколько проектов для удаления.");
    return;
  }

  if (state.cloudMode) {
    const projectsToDelete = state.projects.filter((project) => ids.includes(project.id));
    const paths = projectsToDelete.flatMap((project) => [...project.images, ...project.documents]).map((file) => file.storagePath).filter(Boolean);

    if (paths.length > 0) {
      await supabaseClient.storage.from(storageBucket).remove(paths);
    }

    const { error } = await supabaseClient.from("land_projects").delete().in("id", ids);

    if (error) {
      alert(`Не удалось удалить проекты: ${error.message}`);
      return;
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
  if (state.cloudMode) {
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

      if (state.cloudMode) {
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

function toDbProject(project) {
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
    area_square_meters: project.areaSquareMeters || 0,
    area_points: project.areaPoints || [],
    sections: project.sections || [],
    created_by: state.user.id,
  };
}

function fromDbProject(project, files) {
  const projectFiles = files.filter((file) => file.project_id === project.id).map(fromDbFile);

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
    areaSquareMeters: Number(project.area_square_meters || 0),
    areaPoints: project.area_points || [],
    sections: project.sections || [],
    images: projectFiles.filter((file) => file.kind === "image"),
    documents: projectFiles.filter((file) => file.kind === "document"),
    createdAt: project.created_at,
    updatedAt: project.updated_at,
  });
}

function fromDbFile(file) {
  return {
    id: file.id,
    kind: file.kind,
    name: file.name,
    size: file.size,
    type: file.type,
    storagePath: file.storage_path,
    url: "",
    addedAt: file.created_at,
  };
}

async function attachSignedUrls(projects) {
  const files = projects.flatMap((project) => [...project.images, ...project.documents]);

  await Promise.all(
    files.map(async (file) => {
      file.url = await createSignedFileUrl(file.storagePath);
    }),
  );
}

async function createSignedFileUrl(storagePath) {
  if (!state.cloudMode || !storagePath) {
    return "";
  }

  const { data, error } = await supabaseClient.storage.from(storageBucket).createSignedUrl(storagePath, 60 * 60 * 24);

  if (error) {
    return "";
  }

  return data.signedUrl;
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
