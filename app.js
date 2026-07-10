(function () {
  const STORAGE_KEY = "obraSafetyFindings.v1";
  const SESSION_KEY = "obraSafetyFindings.sessionUser";
  const REMEMBER_EMAIL_KEY = "obraSafetyFindings.rememberEmail";
  const today = new Date();
  const API_BASE_URL = (window.REPORTE_DESVIOS_CONFIG && window.REPORTE_DESVIOS_CONFIG.apiBaseUrl || "").replace(/\/$/, "");
  const API_TOKEN = window.REPORTE_DESVIOS_CONFIG && window.REPORTE_DESVIOS_CONFIG.apiToken || "";
  const params = new URLSearchParams(window.location.search);
  const PUBLIC_REPORT_MODE = params.has("reportar");
  const USER_APP_MODE = params.get("app") === "usuario";
  const DATA_MIGRATION_VERSION = "real-users-gsheet-cleanup-2026-07-06";
  const DELETE_FINDINGS_MIGRATION_VERSION = "delete-h5-h7-2026-07-08";
  const REAL_EMAIL_TEST_SUBJECT = "Prueba correo Hallazgos Seguridad";
  let remoteStateLoaded = false;
  let remoteStateLoading = null;
  let dataChangedByMigration = false;

  const people = [
    { id: "u-karina-espinoza-ayala", name: "Karina Espinoza Ayala", role: "admin", email: "karina.espinoza@constructoraterratunel.com", area: "prevencion", pin: "1234" },
    { id: "u-carlos-romero-gutierrez", name: "Carlos Romero Gutierrez", role: "usuario", email: "carlos.romero@constructoraterratunel.com", area: "prevencion", pin: "1234" },
    { id: "u-julio-febre-guerra", name: "Julio Febre Guerra", role: "admin", email: "jfebre@iccingenieria.cl", area: "prevencion", pin: "1234" }
  ];

  const defaultActionCriteria = [
    { id: "inmediata", label: "inmediata", days: 0, priority: "Alta" },
    { id: "3-dias", label: "3 dias", days: 3, priority: "Media" },
    { id: "1-semana", label: "1 semana", days: 7, priority: "Baja" },
    { id: "2-semanas", label: "2 semanas", days: 14, priority: "Baja" }
  ];

  const defaultSettings = {
    defaultSite: "Aducción Lyon Valparaíso / Terratunel SpA",
    sites: ["Aducción Lyon Valparaíso / Terratunel SpA"]
  };

  const seedFindings = [
    {
      id: "H-2026-001",
      sheetRowId: "FORM-1001",
      createdAt: "2026-06-20",
      detectedAt: "2026-06-20",
      site: "Edificio Norte",
      location: "Piso 8, borde losa",
      description: "Baranda provisoria incompleta en zona de circulacion.",
      initialPhoto: "",
      criticality: "Critica",
      priority: "Alta",
      ownerId: "u-juan",
      assignedEmailAt: "2026-06-20",
      dueDate: "2026-06-24",
      status: "Vencido",
      comments: "Requiere cierre inmediato de acceso.",
      evidence: [],
      closedAt: "",
      history: [
        event("Sistema", "Importado desde Google Sheets"),
        event("Carolina Rivas", "Asignado a Juan Perez con prioridad Alta")
      ]
    },
    {
      id: "H-2026-002",
      sheetRowId: "FORM-1002",
      createdAt: "2026-06-24",
      detectedAt: "2026-06-24",
      site: "Torre Sur",
      location: "Bodega de pinturas",
      description: "Envases inflamables sin rotulacion y apilados junto a tablero electrico.",
      initialPhoto: "",
      criticality: "Alta",
      priority: "Alta",
      ownerId: "u-maria",
      assignedEmailAt: "2026-06-24",
      dueDate: "2026-07-05",
      status: "En gestion",
      comments: "Separar y rotular segun matriz de sustancias peligrosas.",
      evidence: [],
      closedAt: "",
      history: [
        event("Sistema", "Importado desde Google Sheets"),
        event("Maria Soto", "Actualizo estado a En gestion")
      ]
    },
    {
      id: "H-2026-003",
      sheetRowId: "FORM-1003",
      createdAt: "2026-06-27",
      detectedAt: "2026-06-27",
      site: "Urbanizacion Oriente",
      location: "Zanja principal",
      description: "Excavacion sin acceso seguro ni senalizacion nocturna.",
      initialPhoto: "",
      criticality: "Critica",
      priority: "Alta",
      ownerId: "u-diego",
      assignedEmailAt: "2026-06-27",
      dueDate: "2026-07-02",
      status: "Completado por responsable",
      comments: "Pendiente revision de evidencia.",
      evidence: [{ name: "senalizacion-zanja.jpg", uploadedBy: "Diego Morales", uploadedAt: "2026-07-02", note: "Se instalan barreras, cinta y luminarias." }],
      closedAt: "",
      history: [
        event("Sistema", "Importado desde Google Sheets"),
        event("Diego Morales", "Subio evidencia y marco como completado")
      ]
    },
    {
      id: "H-2026-004",
      sheetRowId: "FORM-1004",
      createdAt: "2026-06-15",
      detectedAt: "2026-06-15",
      site: "Edificio Norte",
      location: "Acceso principal",
      description: "Cable de extension cruzando zona peatonal sin proteccion.",
      initialPhoto: "",
      criticality: "Media",
      priority: "Media",
      ownerId: "u-juan",
      assignedEmailAt: "2026-06-15",
      dueDate: "2026-06-18",
      status: "Cerrado",
      comments: "Corregido y validado.",
      evidence: [{ name: "protector-cable.jpg", uploadedBy: "Juan Perez", uploadedAt: "2026-06-17", note: "Cable retirado y ruta protegida." }],
      closedAt: "2026-06-18",
      history: [
        event("Sistema", "Importado desde Google Sheets"),
        event("Juan Perez", "Subio evidencia"),
        event("Carolina Rivas", "Cierre aprobado")
      ]
    },
    {
      id: "H-2026-005",
      sheetRowId: "FORM-1005",
      createdAt: "2026-07-01",
      detectedAt: "2026-07-01",
      site: "Torre Sur",
      location: "Comedor",
      description: "Extintor bloqueado por acopio temporal de materiales.",
      initialPhoto: "",
      criticality: "Media",
      priority: "Alta",
      ownerId: "",
      assignedEmailAt: "",
      dueDate: "2026-07-04",
      status: "Nuevo",
      comments: "",
      evidence: [],
      closedAt: "",
      history: [event("Sistema", "Importado desde Google Sheets")]
    }
  ];

  const state = {
    view: (PUBLIC_REPORT_MODE || USER_APP_MODE) ? "report" : "dashboard",
    currentUserId: sessionStorage.getItem(SESSION_KEY) || "",
    filters: { site: "Todos", status: "Todos", criticality: "Todos", priority: "Todos", ownerId: "Todos", from: "", to: "" },
    chartVisibility: { status: false, criticality: false, priority: false, compliance: false, trend: false, progress: false, pendingOwners: false, slowOwners: false, avgResolve: false, deadline: true, upcoming: true, nonProcessable: false },
    selectedId: "",
    formError: "",
    evidenceMessage: "",
    reportMessage: "",
    data: loadData()
  };

  function event(actor, detail) {
    return { at: todayDate(), actor, detail };
  }

  function todayDate() {
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function loadData() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return migrateData(JSON.parse(raw));
    return { findings: seedFindings, people, emails: [], imports: [], actionCriteria: defaultActionCriteria, settings: defaultSettings };
  }

  function migrateData(data) {
    dataChangedByMigration = false;
    data.people = data.people || people;
    data.people.forEach((person) => {
      if (person.role === "manager") person.role = "usuario";
      if (!person.pin) person.pin = "1234";
    });
    data.findings = data.findings || [];
    data.emails = data.emails || [];
    data.imports = data.imports || [];
    data.actionCriteria = data.actionCriteria || defaultActionCriteria;
    data.settings = { ...defaultSettings, ...(data.settings || {}) };
    data.settings.sites = data.settings.sites && data.settings.sites.length ? data.settings.sites : defaultSettings.sites;
    if (data.settings.sites.some((site) => normalizeHeader(site) === "aduccion" || normalizeHeader(site).includes("aduccion lyon"))) {
      data.settings.sites = [...new Set(data.settings.sites.map((site) => {
        const normalizedSite = normalizeHeader(site);
        return normalizedSite === "aduccion" || normalizedSite.includes("aduccion lyon") ? defaultSettings.defaultSite : site;
      }))];
      data.settings.defaultSite = defaultSettings.defaultSite;
    }
    data.findings.forEach((finding) => {
      const normalizedFindingSite = normalizeHeader(finding.site);
      if (normalizedFindingSite === "aduccion" || normalizedFindingSite.includes("aduccion lyon")) finding.site = defaultSettings.defaultSite;
      if (finding.assignedEmailAt === undefined) finding.assignedEmailAt = finding.ownerId ? finding.detectedAt || finding.createdAt || "" : "";
      if (finding.nonProcessableReason === undefined) finding.nonProcessableReason = "";
      finding.ownerIds = normalizeOwnerIds(finding);
      finding.ownerId = finding.ownerIds[0] || "";
      if (!data.settings.sites.includes(finding.site)) finding.site = data.settings.defaultSite;
    });
    applyRealUsersMigration(data);
    applyDeleteFindingsMigration(data);
    return data;
  }

  function applyRealUsersMigration(data) {
    if (data.settings.dataMigrationVersion === DATA_MIGRATION_VERSION) return;

    const demoPersonIds = new Set(["u-admin", "u-juan", "u-maria", "u-diego"]);
    const realPeople = people.map((person) => ({ ...person }));
    realPeople.forEach((realPerson) => {
      const existing = data.people.find((person) =>
        normalizeHeader(person.email) === normalizeHeader(realPerson.email)
        || normalizeHeader(person.name) === normalizeHeader(realPerson.name)
      );
      if (existing) {
        Object.assign(existing, {
          name: realPerson.name,
          email: realPerson.email,
          area: realPerson.area,
          role: realPerson.role,
          pin: existing.pin || realPerson.pin
        });
      } else {
        data.people.push(realPerson);
      }
    });

    const realPersonIds = new Set(realPeople.map((person) => person.id));
    data.people = data.people.filter((person) => !demoPersonIds.has(person.id) || realPersonIds.has(person.id));

    const beforeFindings = data.findings.length;
    data.findings = data.findings.filter((finding) => {
      const rowId = String(finding.sheetRowId || "");
      return rowId && !rowId.startsWith("WEB-") && !rowId.startsWith("MANUAL-");
    });
    data.findings.forEach((finding) => {
      setFindingOwners(finding, normalizeOwnerIds(finding).filter((id) => !demoPersonIds.has(id)));
    });

    const removedFindings = beforeFindings - data.findings.length;
    data.imports.unshift({
      at: todayDate(),
      detail: `Migracion usuarios reales aplicada. Hallazgos no GSheet eliminados: ${removedFindings}.`
    });
    data.settings.dataMigrationVersion = DATA_MIGRATION_VERSION;
    dataChangedByMigration = true;
  }

  function applyDeleteFindingsMigration(data) {
    if (data.settings.deleteFindingsMigrationVersion === DELETE_FINDINGS_MIGRATION_VERSION) return;
    const deleteIds = new Set(["H-2026-005", "H-2026-006", "H-2026-007"]);
    const beforeFindings = data.findings.length;
    data.findings = data.findings.filter((finding) => !deleteIds.has(finding.id));
    const removedFindings = beforeFindings - data.findings.length;
    data.imports.unshift({
      at: todayDate(),
      detail: removedFindings
        ? `Limpieza solicitada: hallazgos H-2026-005, H-2026-006 y H-2026-007 eliminados.`
        : "Limpieza solicitada revisada: H-2026-005, H-2026-006 y H-2026-007 no estaban presentes."
    });
    data.settings.deleteFindingsMigrationVersion = DELETE_FINDINGS_MIGRATION_VERSION;
    dataChangedByMigration = true;
  }

  function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
    return saveRemoteState();
  }

  async function loadRemoteState(options = {}) {
    const shouldRender = options.render !== false;
    if (remoteStateLoaded) return true;
    if (!API_BASE_URL) return false;
    if (remoteStateLoading) return remoteStateLoading;
    remoteStateLoading = (async () => {
      try {
        const response = await apiFetch("/api/state");
        if (!response.ok) throw new Error(`API ${response.status}`);
        state.data = migrateData(await response.json());
        remoteStateLoaded = true;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
        if (dataChangedByMigration) await saveRemoteState();
        if (shouldRender) render();
        return true;
      } catch (error) {
        console.warn("No se pudo cargar backend productivo; se usa respaldo local.", error);
        return false;
      } finally {
        remoteStateLoading = null;
      }
    })();
    return remoteStateLoading;
  }

  async function saveRemoteState() {
    if (!API_BASE_URL || !remoteStateLoaded) return false;
    try {
      const response = await apiFetch("/api/state", {
        method: "PUT",
        body: JSON.stringify(state.data)
      });
      if (!response.ok) throw new Error(`API ${response.status}`);
      return true;
    } catch (error) {
      console.warn("No se pudo guardar en backend productivo; se mantiene respaldo local.", error);
      return false;
    }
  }

  function currentUser() {
    return state.data.people.find((p) => p.id === state.currentUserId) || null;
  }

  function visibleFindings() {
    const user = currentUser();
    if (!user) return [];
    if (USER_APP_MODE) return state.data.findings.filter((finding) => hasOwner(finding, user.id));
    return state.data.findings.filter((finding) => user.role === "admin" || hasOwner(finding, user.id));
  }

  function filteredFindings() {
    return visibleFindings().filter((finding) => {
      const f = state.filters;
      if (f.site !== "Todos" && finding.site !== f.site) return false;
      if (f.status !== "Todos" && finding.status !== f.status) return false;
      if (f.criticality !== "Todos" && finding.criticality !== f.criticality) return false;
      if (f.priority !== "Todos" && finding.priority !== f.priority) return false;
      if (f.ownerId !== "Todos" && !hasOwner(finding, f.ownerId)) return false;
      if (f.from && finding.detectedAt < f.from) return false;
      if (f.to && finding.detectedAt > f.to) return false;
      return true;
    });
  }

  function operationalFindings(items) {
    return items.filter((finding) => finding.status !== "No procesable");
  }

  function ownerName(id) {
    return state.data.people.find((p) => p.id === id)?.name || "Sin asignar";
  }

  function ownerIds(finding) {
    return normalizeOwnerIds(finding);
  }

  function ownerNames(finding) {
    const ids = ownerIds(finding);
    if (!ids.length) return "Sin asignar";
    return ids.map((id) => ownerName(id)).join(", ");
  }

  function hasOwner(finding, id) {
    return ownerIds(finding).includes(id);
  }

  function normalizeOwnerIds(finding) {
    const values = Array.isArray(finding.ownerIds) ? finding.ownerIds : [];
    if (finding.ownerId) values.unshift(finding.ownerId);
    return [...new Set(values.map((id) => String(id || "").trim()).filter(Boolean))];
  }

  function setFindingOwners(finding, ids) {
    finding.ownerIds = [...new Set((ids || []).map((id) => String(id || "").trim()).filter(Boolean))];
    finding.ownerId = finding.ownerIds[0] || "";
  }

  function sameOwnerSet(a, b) {
    const left = [...new Set(a || [])].sort().join("|");
    const right = [...new Set(b || [])].sort().join("|");
    return left === right;
  }

  function badgeClass(value) {
    return String(value).toLowerCase().replace(/\s+/g, "-").replace("critica", "critica").replace("en-gestion", "gestion").replace("completado-por-responsable", "gestion");
  }

  function setView(view) {
    if (USER_APP_MODE && !["report", "findings"].includes(view)) view = "report";
    state.view = view;
    state.selectedId = "";
    state.formError = "";
    state.evidenceMessage = "";
    state.reportMessage = "";
    render();
  }

  function setFilter(key, value) {
    state.filters[key] = value;
    render();
  }

  function groupCount(items, keyFn) {
    return items.reduce((acc, item) => {
      const key = keyFn(item) || "Sin dato";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  function groupCountByOwners(items) {
    return items.reduce((acc, finding) => {
      const ids = ownerIds(finding);
      if (!ids.length) {
        acc["Sin asignar"] = (acc["Sin asignar"] || 0) + 1;
        return acc;
      }
      ids.forEach((id) => {
        const key = ownerName(id);
        acc[key] = (acc[key] || 0) + 1;
      });
      return acc;
    }, {});
  }

  function isOverdue(finding) {
    return finding.status !== "Cerrado" && finding.status !== "No procesable" && finding.dueDate && new Date(finding.dueDate + "T23:59:59") < today;
  }

  function daysUntilDue(finding) {
    if (!finding.dueDate || finding.status === "Cerrado" || finding.status === "No procesable") return null;
    return Math.ceil((new Date(finding.dueDate + "T00:00:00") - today) / 86400000);
  }

  function deadlineStatus(finding) {
    if (finding.status === "Cerrado") return "Cerrado";
    if (finding.status === "No procesable") return "No procesable";
    const days = daysUntilDue(finding);
    if (days === null) return "Sin plazo";
    if (days < 0) return "Vencido";
    if (days === 0) return "Vence hoy";
    if (days <= 3) return "Por vencer";
    return "En plazo";
  }

  function daysBetween(a, b) {
    const start = new Date(a + "T00:00:00");
    const end = new Date(b + "T00:00:00");
    return Math.max(0, Math.round((end - start) / 86400000));
  }

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
  }

  function options(values, selected) {
    return values.map((value) => `<option value="${esc(value)}" ${value === selected ? "selected" : ""}>${esc(value)}</option>`).join("");
  }

  function assignmentPeople() {
    return state.data.people.filter((p) => ["admin", "usuario"].includes(p.role));
  }

  function personOptions(selected, includeAll) {
    const users = assignmentPeople();
    const base = includeAll ? [{ id: "Todos", name: "Todos" }] : [{ id: "", name: "Sin asignar" }];
    return base.concat(users).map((p) => `<option value="${esc(p.id)}" ${p.id === selected ? "selected" : ""}>${esc(p.name)}</option>`).join("");
  }

  function peopleCheckboxes(selectedIds, name, disabled = false) {
    const selected = new Set(selectedIds || []);
    const people = assignmentPeople();
    if (!people.length) return `<div class="notice">No hay personas enroladas para asignar.</div>`;
    return `
      ${disabled ? "" : `<input type="hidden" name="${esc(name)}" value="">`}
      <div class="check-list">
        ${people.map((person) => `
          <label class="check-row">
            <input type="checkbox" name="${esc(name)}" value="${esc(person.id)}" ${selected.has(person.id) ? "checked" : ""} ${disabled ? "disabled" : ""}>
            <span>${esc(person.name)} <small>${esc(person.role)}</small></span>
          </label>
        `).join("")}
      </div>
    `;
  }

  function siteCatalog() {
    return state.data.settings.sites && state.data.settings.sites.length ? state.data.settings.sites : defaultSettings.sites;
  }

  function normalizeSite(site) {
    const cleaned = String(site || "").trim();
    const match = siteCatalog().find((item) => normalizeHeader(item) === normalizeHeader(cleaned));
    return match || state.data.settings.defaultSite || defaultSettings.defaultSite;
  }

  function actionCriteriaOptions(selected) {
    return state.data.actionCriteria.map((criterion) => `<option value="${esc(criterion.label)}" ${sameCriterion(criterion.label, selected) ? "selected" : ""}>${esc(criterion.label)}</option>`).join("");
  }

  function sameCriterion(a, b) {
    return normalizeHeader(a) === normalizeHeader(b);
  }

  function getCriterion(value) {
    const normalized = normalizeHeader(value);
    return state.data.actionCriteria.find((criterion) => normalizeHeader(criterion.label) === normalized)
      || state.data.actionCriteria.find((criterion) => normalized.includes(normalizeHeader(criterion.label)))
      || state.data.actionCriteria[1]
      || defaultActionCriteria[1];
  }

  function calculateDaysUsed(finding) {
    if (!finding.assignedEmailAt) return "Pendiente envio correo";
    const endDate = finding.closedAt || todayDate();
    return `${daysBetween(finding.assignedEmailAt, endDate)} dias`;
  }

  function render() {
    refreshOverdue();
    if (PUBLIC_REPORT_MODE) {
      document.getElementById("app").innerHTML = `
        <main class="content public-report">
          ${renderReport()}
        </main>
      `;
      bindEvents();
      return;
    }
    const user = currentUser();
    if (!USER_APP_MODE && user && user.role !== "admin") {
      sessionStorage.removeItem(SESSION_KEY);
      state.currentUserId = "";
      state.selectedId = "";
      state.formError = "Acceso restringido: solo administradores pueden entrar a la web.";
      document.getElementById("app").innerHTML = renderLogin();
      bindLoginEvents();
      return;
    }
    if (!user) {
      document.getElementById("app").innerHTML = renderLogin();
      bindLoginEvents();
      return;
    }
    document.getElementById("app").innerHTML = `
      <div class="shell">
        <aside class="sidebar">
          <div class="brand">
            <div class="brand-mark">HS</div>
            <div>
              <h1>Hallazgos Seguridad</h1>
              <p>Obras y evidencias</p>
            </div>
          </div>
          <div class="profile">
            <label>Cuenta activa</label>
            <strong>${esc(user.name)}</strong>
            <span>${esc(user.role === "admin" ? "Admin" : "Usuario")}</span>
            <button class="btn secondary compact" data-action="logout">Salir</button>
          </div>
          <nav class="nav">
            ${USER_APP_MODE ? "" : navButton("dashboard", "Dashboard")}
            ${navButton("report", "Reportar")}
            ${navButton("findings", "Hallazgos")}
            ${!USER_APP_MODE && user.role === "admin" ? navButton("import", "Importar Sheets") : ""}
            ${!USER_APP_MODE && user.role === "admin" ? navButton("people", "Personas") : ""}
            ${USER_APP_MODE ? "" : navButton("emails", "Alertas correo")}
            <button class="nav-logout" data-action="logout">Salir</button>
          </nav>
        </aside>
        <main class="content">
          ${renderView()}
        </main>
      </div>
      ${state.selectedId ? renderFindingModal(state.selectedId) : ""}
    `;
    bindEvents();
  }

  function renderBoot(message) {
    document.getElementById("app").innerHTML = `
      <main class="content public-report">
        <section class="panel">
          <div class="panel-header"><h3>Hallazgos Seguridad</h3></div>
          <p class="plain-text">${esc(message)}</p>
        </section>
      </main>
    `;
  }

  function renderLogin() {
    const rememberedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY) || "";
    return `
      <div class="login-shell">
        <section class="login-card">
          <div class="brand login-brand">
            <div class="brand-mark">HS</div>
            <div>
              <h1>Hallazgos Seguridad</h1>
              <p>Aduccion Lyon Valparaiso / Terratunel SpA</p>
            </div>
          </div>
          <p class="plain-text">${USER_APP_MODE ? "Acceso para responsables autorizados." : "Acceso exclusivo para administradores."}</p>
          <form data-action="login" class="form-grid">
            <div class="field span-2">
              <label>Correo</label>
              <input name="email" type="email" autocomplete="username" placeholder="tu.correo@empresa.cl" value="${esc(rememberedEmail)}">
            </div>
            <div class="field span-2">
              <label>PIN</label>
              <input name="pin" type="password" inputmode="numeric" autocomplete="current-password" placeholder="Ingresa tu PIN">
            </div>
            <label class="remember-user span-2">
              <input name="rememberEmail" type="checkbox" ${rememberedEmail ? "checked" : ""}>
              <span>Recordar mi correo en este equipo</span>
            </label>
            ${state.formError ? `<div class="notice span-2">${esc(state.formError)}</div>` : ""}
            <div class="actions span-2" style="justify-content:flex-start">
              <button class="btn" type="submit">Entrar</button>
            </div>
          </form>
        </section>
      </div>
    `;
  }

  function bindLoginEvents() {
    document.querySelector("[data-action='login']")?.addEventListener("submit", loginUser);
  }

  function loginUser(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    const email = normalizeHeader(form.get("email"));
    const pin = String(form.get("pin") || "").trim();
    const rememberEmail = form.get("rememberEmail") === "on";
    const user = state.data.people.find((person) => normalizeHeader(person.email) === email);
    if (!user || String(user.pin || "") !== pin) {
      state.formError = "Usuario o PIN incorrecto.";
      render();
      return;
    }
    if (!USER_APP_MODE && user.role !== "admin") {
      state.formError = "Acceso restringido: solo administradores pueden entrar a la web.";
      render();
      return;
    }
    state.currentUserId = user.id;
    sessionStorage.setItem(SESSION_KEY, user.id);
    if (rememberEmail) localStorage.setItem(REMEMBER_EMAIL_KEY, user.email);
    else localStorage.removeItem(REMEMBER_EMAIL_KEY);
    state.formError = "";
    state.view = USER_APP_MODE ? "report" : "dashboard";
    render();
  }

  function navButton(view, label) {
    return `<button class="${state.view === view ? "active" : ""}" data-action="view" data-view="${view}">${label}</button>`;
  }

  function renderView() {
    if (USER_APP_MODE) {
      if (state.view === "findings") return renderFindings();
      return renderReport();
    }
    if (state.view === "dashboard") return renderDashboard();
    if (state.view === "report") return renderReport();
    if (state.view === "findings") return renderFindings();
    if (state.view === "import") return renderImport();
    if (state.view === "people") return renderPeople();
    if (state.view === "emails") return renderEmails();
    return renderDashboard();
  }

  function renderTop(title, subtitle, actions = "") {
    return `
      <section class="topbar">
        <div>
          <h2>${esc(title)}</h2>
          <p>${esc(subtitle)}</p>
        </div>
        <div class="actions">${actions}</div>
      </section>
    `;
  }

  function renderFilters() {
    const sites = ["Todos", ...siteCatalog()];
    return `
      <section class="filters">
        <div class="field"><label>Obra</label><select data-filter="site">${options(sites, state.filters.site)}</select></div>
        <div class="field"><label>Estado</label><select data-filter="status">${options(["Todos", "Nuevo", "Asignado", "En gestion", "Completado por responsable", "Observado", "Cerrado", "Vencido", "No procesable"], state.filters.status)}</select></div>
        <div class="field"><label>Criticidad</label><select data-filter="criticality">${options(["Todos", "Critica", "Alta", "Media", "Baja"], state.filters.criticality)}</select></div>
        <div class="field"><label>Prioridad</label><select data-filter="priority">${options(["Todos", "Alta", "Media", "Baja"], state.filters.priority)}</select></div>
        <div class="field"><label>Responsable</label><select data-filter="ownerId">${personOptions(state.filters.ownerId, true)}</select></div>
        <div class="field"><label>Desde</label><input type="date" value="${esc(state.filters.from)}" data-filter="from"></div>
        <div class="field"><label>Hasta</label><input type="date" value="${esc(state.filters.to)}" data-filter="to"></div>
        <div class="field"><label>&nbsp;</label><button class="btn secondary" data-action="clear-filters">Limpiar filtros</button></div>
      </section>
    `;
  }

  function reportQrUrl() {
    const url = new URL(window.location.href);
    url.search = "?reportar=1";
    url.hash = "";
    return url.toString();
  }

  function renderDashboard() {
    const allItems = filteredFindings();
    const items = operationalFindings(allItems);
    const nonProcessable = allItems.filter((f) => f.status === "No procesable");
    const closed = items.filter((f) => f.status === "Cerrado");
    const overdue = items.filter(isOverdue);
    const avgClose = closed.length ? Math.round(closed.reduce((sum, f) => sum + daysBetween(f.detectedAt, f.closedAt || f.detectedAt), 0) / closed.length) : 0;
    return `
      ${renderTop("Dashboard", "Indicadores filtrables para administrar criticidad, prioridad, responsables y cierre.")}
      ${renderFilters()}
      ${renderChartConfig()}
      <section class="grid kpis">
        <div class="kpi"><span>Total</span><strong>${items.length}</strong></div>
        <div class="kpi"><span>Criticos</span><strong>${items.filter((f) => f.criticality === "Critica").length}</strong></div>
        <div class="kpi"><span>Vencidos</span><strong>${overdue.length}</strong></div>
        <div class="kpi"><span>Cerrados</span><strong>${closed.length}</strong></div>
        <div class="kpi"><span>No procesables</span><strong>${nonProcessable.length}</strong></div>
        <div class="kpi"><span>Dias prom. resolver</span><strong>${avgClose}</strong></div>
      </section>
      <section class="grid charts">
        ${state.chartVisibility.status ? barChart("Hallazgos por estado", groupCount(items, (f) => f.status)) : ""}
        ${state.chartVisibility.criticality ? barChart("Hallazgos por criticidad", groupCount(items, (f) => f.criticality)) : ""}
        ${state.chartVisibility.priority ? barChart("Hallazgos por prioridad", groupCount(items, (f) => f.priority)) : ""}
        ${state.chartVisibility.compliance ? barChart("Cumplimiento por responsable", groupCountByOwners(items.filter((f) => f.status === "Cerrado"))) : ""}
        ${state.chartVisibility.trend ? barChart("Tendencia mensual", groupCount(items, (f) => f.detectedAt.slice(0, 7))) : ""}
        ${state.chartVisibility.progress ? donutChart(items) : ""}
        ${state.chartVisibility.pendingOwners ? pendingOwnersChart(items) : ""}
        ${state.chartVisibility.slowOwners ? slowOwnersRanking(items) : ""}
        ${state.chartVisibility.avgResolve ? averageResolveChart(items) : ""}
        ${state.chartVisibility.deadline ? barChart("Semaforo de plazo", groupCount(items, deadlineStatus)) : ""}
        ${state.chartVisibility.upcoming ? upcomingDeadlinesList(items) : ""}
        ${state.chartVisibility.nonProcessable ? nonProcessableChart(nonProcessable) : ""}
      </section>
    `;
  }

  function renderChartConfig() {
    const labels = {
      status: "Estado",
      criticality: "Criticidad",
      priority: "Prioridad",
      compliance: "Cumplimiento",
      trend: "Tendencia",
      progress: "Avance",
      pendingOwners: "Pendientes por responsable",
      slowOwners: "Ranking demora",
      avgResolve: "Promedio resolver",
      deadline: "Semaforo plazo",
      upcoming: "Proximos vencimientos",
      nonProcessable: "No procesables"
    };
    return `
      <section class="panel chart-config">
        <div class="panel-header"><h3>Graficos visibles</h3></div>
        <div class="toggle-grid">
          ${Object.entries(labels).map(([key, label]) => `
            <label class="toggle">
              <input type="checkbox" data-chart-toggle="${key}" ${state.chartVisibility[key] ? "checked" : ""}>
              <span>${label}</span>
            </label>
          `).join("")}
        </div>
      </section>
    `;
  }

  function barChart(title, counts) {
    const entries = Object.entries(counts);
    const max = Math.max(1, ...entries.map(([, count]) => count));
    const rows = entries.length ? entries.map(([label, count]) => `
      <div class="bar-row">
        <span>${esc(label)}</span>
        <div class="bar-track"><span class="bar-fill" style="width:${Math.max(8, (count / max) * 100)}%"></span></div>
        <strong>${count}</strong>
      </div>
    `).join("") : `<div class="empty">Sin datos para el filtro actual</div>`;
    return `<article class="panel chart"><div class="panel-header"><h3>${esc(title)}</h3></div>${rows}</article>`;
  }

  function pendingOwnersChart(items) {
    const pending = items.filter((f) => f.status !== "Cerrado");
    return barChart("Responsables con pendientes", groupCountByOwners(pending));
  }

  function slowOwnersRanking(items) {
    const closed = items.filter((f) => f.status === "Cerrado" && f.assignedEmailAt && f.closedAt);
    const grouped = {};
    closed.forEach((finding) => {
      const ids = ownerIds(finding);
      const owners = ids.length ? ids : [""];
      owners.forEach((id) => {
        const owner = id ? ownerName(id) : "Sin asignar";
        grouped[owner] = grouped[owner] || [];
        grouped[owner].push(daysBetween(finding.assignedEmailAt, finding.closedAt));
      });
    });
    const averages = Object.fromEntries(Object.entries(grouped)
      .map(([owner, values]) => [owner, Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)])
      .sort((a, b) => b[1] - a[1]));
    return barChart("Ranking responsables que mas se demoran", averages);
  }

  function averageResolveChart(items) {
    const closed = items.filter((f) => f.status === "Cerrado" && f.assignedEmailAt && f.closedAt);
    const avg = closed.length ? Math.round(closed.reduce((sum, finding) => sum + daysBetween(finding.assignedEmailAt, finding.closedAt), 0) / closed.length) : 0;
    const byCriticality = groupAverage(closed, (f) => f.criticality, (f) => daysBetween(f.assignedEmailAt, f.closedAt));
    return `
      <article class="panel chart">
        <div class="panel-header"><h3>Promedio de dias en resolver</h3></div>
        <div class="big-metric"><strong>${avg}</strong><span>dias promedio</span></div>
        ${Object.keys(byCriticality).length ? renderMiniRows(byCriticality, "dias") : `<div class="empty">Sin cierres para calcular promedio</div>`}
      </article>
    `;
  }

  function upcomingDeadlinesList(items) {
    const upcoming = items
      .filter((finding) => finding.status !== "Cerrado" && finding.dueDate)
      .map((finding) => ({ finding, days: daysUntilDue(finding) }))
      .sort((a, b) => a.days - b.days)
      .slice(0, 6);
    return `
      <article class="panel chart">
        <div class="panel-header"><h3>Proximos vencimientos</h3></div>
        ${upcoming.length ? upcoming.map(({ finding, days }) => `
          <div class="deadline-row">
            <div>
              <strong>${esc(finding.id)}</strong>
              <span>${esc(ownerNames(finding))} · ${esc(finding.location)}</span>
            </div>
            <span class="badge ${badgeClass(deadlineStatus(finding))}">${days < 0 ? `${Math.abs(days)} dias vencido` : `${days} dias`}</span>
          </div>
        `).join("") : `<div class="empty">Sin vencimientos pendientes</div>`}
      </article>
    `;
  }

  function nonProcessableChart(items) {
    return barChart("Hallazgos no procesables", groupCount(items, (f) => f.nonProcessableReason || "Sin justificacion"));
  }

  function groupAverage(items, keyFn, valueFn) {
    const grouped = {};
    items.forEach((item) => {
      const key = keyFn(item) || "Sin dato";
      grouped[key] = grouped[key] || [];
      grouped[key].push(valueFn(item));
    });
    return Object.fromEntries(Object.entries(grouped).map(([key, values]) => [key, Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)]));
  }

  function renderMiniRows(values, suffix) {
    return Object.entries(values).map(([label, value]) => `
      <div class="mini-row"><span>${esc(label)}</span><strong>${esc(value)} ${esc(suffix)}</strong></div>
    `).join("");
  }

  function donutChart(items) {
    const total = Math.max(1, items.length);
    const closed = items.filter((f) => f.status === "Cerrado").length;
    const completed = items.filter((f) => f.status === "Completado por responsable").length;
    const overdue = items.filter(isOverdue).length;
    const closedDeg = (closed / total) * 360;
    const completedDeg = closedDeg + (completed / total) * 360;
    const overdueDeg = completedDeg + (overdue / total) * 360;
    const style = `background:conic-gradient(var(--ok) 0deg ${closedDeg}deg, var(--info) ${closedDeg}deg ${completedDeg}deg, var(--danger) ${completedDeg}deg ${overdueDeg}deg, #dce5e8 ${overdueDeg}deg 360deg)`;
    return `
      <article class="panel chart">
        <div class="panel-header"><h3>Avance global</h3></div>
        <div class="donut-wrap"><div class="donut" style="${style}" data-label="${closed}/${items.length} cerrados"></div></div>
      </article>
    `;
  }

  function renderReport() {
    const user = currentUser();
    const reporterName = user?.name || "";
    const reporterEmail = user?.email || "";
    const canConfigure = user?.role === "admin" && !PUBLIC_REPORT_MODE;
    return `
      ${renderTop("Reportar", "Ingreso interno de hallazgos directo a la plataforma.", `<button class="btn" type="submit" form="internal-report-form">Enviar reporte</button>`)}
      <section class="grid two-col">
        <div class="panel">
          <div class="panel-header"><h3>Nuevo reporte en terreno</h3></div>
          ${state.reportMessage ? `<div class="notice">${esc(state.reportMessage)}</div>` : ""}
          <form id="internal-report-form" data-action="submit-report">
            <div class="field">
              <label>1. Obra *</label>
              <select data-report-field="site" required>${options(siteCatalog(), state.data.settings.defaultSite || defaultSettings.defaultSite)}</select>
            </div>
            <div class="field" style="margin-top:12px">
              <label>2. Ubicacion *</label>
              <input data-report-field="location" placeholder="Ej: excavacion estanque lyon" required>
            </div>
            <div class="field" style="margin-top:12px">
              <label>3. Que estas reportando *</label>
              <select data-report-field="category" required>
                ${options(["Condicion insegura", "Acto inseguro", "Incidente sin lesion", "Observacion preventiva", "Otro"], "Condicion insegura")}
              </select>
            </div>
            <div class="field" style="margin-top:12px">
              <label>4. Describe lo observado con tus palabras *</label>
              <textarea data-report-field="description" placeholder="Describe el riesgo, condicion o acto observado" required></textarea>
            </div>
            <div class="form-grid" style="margin-top:12px">
              <div class="field">
                <label>Tomar foto (opcional)</label>
                <input type="file" accept="image/*" capture="environment" data-report-photo>
              </div>
              <div class="field">
                <label>Grabar video (opcional)</label>
                <input type="file" accept="video/*" capture="environment" data-report-video>
              </div>
              <div class="field span-2">
                <label>Adjuntar desde galeria (opcional)</label>
                <input type="file" accept="image/*,video/*" data-report-file>
              </div>
            </div>
            <div class="form-grid" style="margin-top:12px">
              <div class="field">
                <label>Nombre reportante (opcional)</label>
                <input data-report-field="reporterName" value="${esc(reporterName)}" placeholder="Nombre">
              </div>
              <div class="field">
                <label>Correo reportante (opcional)</label>
                <input type="email" data-report-field="reporterEmail" value="${esc(reporterEmail)}" placeholder="correo@empresa.cl">
              </div>
            </div>
            <div class="actions" style="justify-content:flex-start;margin-top:12px">
              <button class="btn" type="submit">Enviar reporte</button>
            </div>
          </form>
        </div>
        ${canConfigure ? `<div class="panel">
          <div class="panel-header"><h3>Configuracion</h3></div>
          <div class="field">
            <label>Obra por defecto</label>
            <select data-setting="defaultSite">${options(siteCatalog(), state.data.settings.defaultSite || defaultSettings.defaultSite)}</select>
          </div>
          <div class="field" style="margin-top:12px">
            <label>Listado de obras</label>
            <textarea data-setting="sitesText">${esc(siteCatalog().join("\n"))}</textarea>
          </div>
          <div class="field" style="margin-top:12px">
            <label>Link para QR</label>
            <input readonly value="${esc(reportQrUrl())}">
          </div>
          <div class="qr-preview">
            <img src="./qr-reporte-hallazgos.png?v=required-fields-1" alt="QR para reportar hallazgos">
            <span>Imprime este QR en terreno para abrir el formulario publico.</span>
          </div>
          <div class="actions" style="justify-content:flex-start;margin-top:12px">
            <button class="btn secondary" data-action="save-settings">Guardar configuracion</button>
            <a class="btn secondary" href="${esc(reportQrUrl())}" target="_blank" rel="noreferrer">Abrir link QR</a>
            <a class="btn secondary" href="./qr-reporte-hallazgos.png?v=required-fields-1" download="qr-reporte-hallazgos.png">Descargar QR</a>
          </div>
        </div>` : ""}
        <div class="panel">
          <div class="panel-header"><h3>Flujo actual</h3></div>
          <ul class="timeline">
            <li><strong>1. Reporte interno</strong><br>El hallazgo se crea directo en la plataforma.</li>
            <li><strong>2. Evidencia inicial</strong><br>El archivo queda guardado por el backend si viene adjunto.</li>
            <li><strong>3. Gestion</strong><br>Administrador clasifica, prioriza y asigna responsable.</li>
            <li><strong>4. Cierre</strong><br>Responsable carga evidencia final y administrador valida.</li>
          </ul>
        </div>
      </section>
    `;
  }

  function renderFindings() {
    const user = currentUser();
    const items = filteredFindings();
    const actions = USER_APP_MODE ? "" : `${user.role === "admin" ? `<button class="btn" data-action="new-finding">Nuevo hallazgo</button>` : ""}<button class="btn secondary" data-action="export-findings">Exportar CSV</button>`;
    return `
      ${renderTop("Hallazgos", user.role === "admin" ? "Clasifica, asigna, revisa evidencias y cierra hallazgos." : "Gestiona tus hallazgos asignados y sube evidencia.", actions)}
      ${USER_APP_MODE ? "" : renderFilters()}
      ${!USER_APP_MODE && user.role === "admin" ? renderBulkAssign(items) : ""}
      <section class="panel">
        <div class="table-wrap">
          <table class="mobile-cards">
            <thead>
              <tr>
                ${!USER_APP_MODE && user.role === "admin" ? "<th></th>" : ""}<th>ID</th><th>Fecha emision</th><th>Obra</th><th>Ubicacion</th><th>Criticidad</th><th>Prioridad</th><th>Responsable</th><th>Vence</th><th>Plazo</th><th>Estado</th><th></th>
              </tr>
            </thead>
            <tbody>
              ${items.map((f) => `
                <tr>
                  ${!USER_APP_MODE && user.role === "admin" ? `<td data-label="Sel."><input type="checkbox" data-bulk-id="${esc(f.id)}" ${["Cerrado", "No procesable"].includes(f.status) ? "disabled" : ""}></td>` : ""}
                  <td data-label="ID"><strong>${esc(f.id)}</strong></td>
                  <td data-label="Fecha">${esc(f.createdAt || f.detectedAt || "")}</td>
                  <td data-label="Obra">${esc(f.site)}</td>
                  <td data-label="Ubicacion">${esc(f.location)}</td>
                  <td data-label="Criticidad"><span class="badge ${badgeClass(f.criticality)}">${esc(f.criticality)}</span></td>
                  <td data-label="Prioridad"><span class="badge ${badgeClass(f.priority)}">${esc(f.priority)}</span></td>
                  <td data-label="Responsable">${esc(ownerNames(f))}</td>
                  <td data-label="Vence">${esc(f.dueDate)}</td>
                  <td data-label="Plazo"><span class="badge ${badgeClass(deadlineStatus(f))}">${esc(deadlineStatus(f))}</span></td>
                  <td data-label="Estado"><span class="badge ${badgeClass(f.status)}">${esc(f.status)}</span>${f.status === "No procesable" && f.nonProcessableReason ? `<div class="muted-note">${esc(f.nonProcessableReason)}</div>` : ""}</td>
                  <td class="action-cell">
                    <div class="row-actions">
                      <button class="btn secondary" data-action="open" data-id="${esc(f.id)}">Abrir</button>
                      ${!USER_APP_MODE && user.role === "admin" ? `<button class="btn danger" data-action="delete-finding" data-id="${esc(f.id)}">Eliminar</button>` : ""}
                    </div>
                  </td>
                </tr>
              `).join("") || `<tr><td colspan="${!USER_APP_MODE && user.role === "admin" ? "12" : "11"}" class="empty">No hay hallazgos asignados a tu usuario</td></tr>`}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  function renderBulkAssign(items) {
    const assignable = items.filter((finding) => !["Cerrado", "No procesable"].includes(finding.status));
    return `
      <section class="panel">
        <div class="panel-header"><h3>Gestion masiva</h3></div>
        <div class="actions bulk-actions">
          <button class="btn secondary" data-action="select-unassigned" ${assignable.some((f) => !ownerIds(f).length) ? "" : "disabled"}>Seleccionar sin responsable</button>
          <div class="field compact-field owners-field"><label>Responsables</label>${peopleCheckboxes([], "bulkOwnerIds")}</div>
          <div class="field compact-field"><label>Criterio</label><select data-bulk-criterion>${actionCriteriaOptions("3 dias")}</select></div>
          <button class="btn" data-action="bulk-assign">Asignar seleccionados</button>
        </div>
      </section>
    `;
  }

  function renderImport() {
    const apiLabel = API_BASE_URL ? API_BASE_URL : "Sin backend configurado";
    return `
      ${renderTop("Importar desde Google Sheets", "Pega filas CSV exportadas desde la hoja de respuestas del Form. La web evita duplicados usando el ID de fila/formulario.")}
      <section class="grid two-col">
        <div class="panel">
          <div class="panel-header"><h3>Conexion productiva</h3></div>
          <div class="notice">API: ${esc(apiLabel)}</div>
          <div class="actions" style="justify-content:flex-start;margin-top:12px">
            <button class="btn secondary" data-action="check-backend">Probar backend</button>
            <button class="btn secondary" data-action="check-auto-import">Ver autoimportacion</button>
            <button class="btn secondary" data-action="check-google-sheets">Probar GSheet</button>
            <button class="btn secondary" data-action="run-backend-reminders">Generar recordatorios backend</button>
          </div>
        </div>
        <div class="panel">
          <div class="notice">Acepta CSV historico con encabezados o el formato simple: sheetRowId,fecha,obra,ubicacion,descripcion,foto</div>
          <div class="field" style="margin-top:12px">
            <label>CSV desde Sheets</label>
            <textarea data-import-csv placeholder="FORM-1006,2026-07-03,Torre Sur,Piso 3,Andamio sin rodapie,https://..."></textarea>
          </div>
          <div class="field" style="margin-top:12px">
            <label>O cargar archivo CSV</label>
            <input type="file" accept=".csv,text/csv" data-import-file>
          </div>
          <div class="actions" style="justify-content:flex-start;margin-top:12px">
            <button class="btn" data-action="import-google-sheets">Importar automatico GSheet</button>
            <button class="btn" data-action="import-csv">Importar nuevos</button>
            <button class="btn secondary" data-action="sample-csv">Cargar ejemplo</button>
            <button class="btn danger" data-action="reset-data">Limpiar datos actuales</button>
          </div>
        </div>
      </section>
      <section class="grid two-col">
        <div class="panel">
          <div class="panel-header"><h3>Ultimas importaciones</h3></div>
          <ul class="timeline">
            ${state.data.imports.map((i) => `<li><strong>${esc(i.at)}</strong> ${esc(i.detail)}</li>`).join("") || `<li>Sin importaciones manuales todavia.</li>`}
          </ul>
        </div>
      </section>
    `;
  }

  function renderPeople() {
    return `
      ${renderTop("Personas predefinidas", "Responsables disponibles para asignaciones, permisos y alertas.", `<button class="btn" data-action="add-person">Agregar persona</button>`)}
      <section class="grid two-col">
        <div class="panel">
          <div class="panel-header"><h3>Carga masiva de personas</h3></div>
          <div class="notice">Formato recomendado: nombre,correo,area,rol,pin. Si el correo o nombre ya existe, se actualiza.</div>
          <div class="field" style="margin-top:12px">
            <label>Listado CSV</label>
            <textarea data-people-csv placeholder="nombre,correo,area,rol,pin&#10;Karina Espinoza Ayala,karina.espinoza@constructoraterratunel.com,prevencion,admin,1234&#10;Carlos Romero Gutierrez,carlos.romero@constructoraterratunel.com,prevencion,usuario,1234"></textarea>
          </div>
          <div class="field" style="margin-top:12px">
            <label>O cargar archivo CSV</label>
            <input type="file" accept=".csv,text/csv" data-people-file>
          </div>
          <div class="actions" style="justify-content:flex-start;margin-top:12px">
            <button class="btn" data-action="import-people">Cargar personas</button>
            <button class="btn secondary" data-action="sample-people">Cargar ejemplo</button>
          </div>
        </div>
        <div class="panel">
          <div class="panel-header"><h3>Reglas de administracion</h3></div>
          <p class="plain-text">Las personas con hallazgos pendientes pueden eliminarse, pero sus hallazgos quedan sin responsable para reasignacion. La cuenta activa y el ultimo administrador no se eliminan.</p>
        </div>
      </section>
      <section class="panel">
        <div class="panel-header"><h3>Directorio editable</h3></div>
        <div class="table-wrap">
          <table class="mobile-cards">
            <thead><tr><th>Acciones</th><th>Nombre</th><th>Correo</th><th>Area</th><th>Rol</th><th>PIN</th><th>Pendientes</th></tr></thead>
            <tbody>
              ${state.data.people.map((p) => `
                <tr>
                  <td class="action-cell"><button class="btn danger compact" data-action="delete-person" data-person-id="${esc(p.id)}">Eliminar</button></td>
                  <td data-label="Nombre"><input value="${esc(p.name)}" data-person-field="name" data-person-id="${esc(p.id)}"></td>
                  <td data-label="Correo"><input type="email" value="${esc(p.email)}" data-person-field="email" data-person-id="${esc(p.id)}"></td>
                  <td data-label="Area"><input value="${esc(p.area)}" data-person-field="area" data-person-id="${esc(p.id)}"></td>
                  <td data-label="Rol"><select data-person-field="role" data-person-id="${esc(p.id)}">${options(["admin", "usuario"], p.role)}</select></td>
                  <td data-label="PIN"><input type="password" value="${esc(p.pin || "")}" data-person-field="pin" data-person-id="${esc(p.id)}"></td>
                  <td data-label="Pendientes">${visibleFindings().filter((finding) => hasOwner(finding, p.id) && finding.status !== "Cerrado").length}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </section>
      <section class="panel">
        <div class="panel-header"><h3>Criterios de accion configurables</h3></div>
        <div class="table-wrap">
          <table class="mobile-cards compact-cards">
            <thead><tr><th>Criterio</th><th>Plazo en dias</th><th>Prioridad sugerida</th></tr></thead>
            <tbody>
              ${state.data.actionCriteria.map((criterion) => `
                <tr>
                  <td data-label="Criterio"><strong>${esc(criterion.label)}</strong></td>
                  <td data-label="Dias"><input type="number" min="0" value="${esc(criterion.days)}" data-criterion-days="${esc(criterion.id)}"></td>
                  <td data-label="Prioridad"><select data-criterion-priority="${esc(criterion.id)}">${options(["Alta", "Media", "Baja"], criterion.priority)}</select></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  function renderEmails() {
    return `
      ${renderTop("Alertas de correo", "Bandeja de salida para asignaciones, vencimientos, observaciones y cierres.", `<button class="btn secondary" data-action="send-test-emails">Enviar prueba usuarios</button><button class="btn" data-action="generate-reminders">Generar recordatorios</button>`)}
      <section class="panel">
        <div class="table-wrap">
          <table class="mobile-cards mail-cards">
            <thead><tr><th>Fecha</th><th>Para</th><th>Asunto</th><th>Estado</th><th>Detalle</th></tr></thead>
            <tbody>
              ${state.data.emails.map((mail) => `
                <tr>
                  <td data-label="Fecha">${esc(mail.at)}</td>
                  <td data-label="Para">${esc(mail.to)}</td>
                  <td data-label="Asunto"><strong>${esc(mail.subject)}</strong></td>
                  <td data-label="Estado"><span class="badge ${badgeClass(mail.status || "simulado")}">${esc(emailStatusLabel(mail))}</span>${mail.provider ? `<div class="muted-note">${esc(mail.provider)}</div>` : ""}</td>
                  <td data-label="Detalle">${mail.errorMessage ? `<strong>Error:</strong> ${esc(mail.errorMessage)}<br>` : ""}${esc(mail.body)}</td>
                </tr>
              `).join("") || `<tr><td colspan="5" class="empty">Aun no hay correos generados.</td></tr>`}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  function renderFindingModal(id) {
    const f = state.data.findings.find((item) => item.id === id);
    const user = currentUser();
    const admin = !USER_APP_MODE && user.role === "admin";
    const canManage = admin || hasOwner(f, user.id);
    return `
      <div class="modal-backdrop">
        <section class="modal">
          <div class="panel-header">
            <h3>${f.id} · ${esc(f.site)}</h3>
            <button class="btn secondary" data-action="close-modal">Cerrar</button>
          </div>
          ${state.formError ? `<div class="notice">${esc(state.formError)}</div>` : ""}
          <div class="grid two-col">
            <form class="panel form-grid" data-action="save-finding">
              <div class="field"><label>Fecha emision</label><input value="${esc(f.createdAt || f.detectedAt || "")}" disabled></div>
              <div class="field"><label>Fecha deteccion</label><input type="date" name="detectedAt" value="${esc(f.detectedAt || f.createdAt || "")}" ${admin ? "" : "disabled"}></div>
              <div class="field"><label>Obra</label><select name="site" ${admin ? "" : "disabled"}>${options(siteCatalog(), f.site)}</select></div>
              <div class="field"><label>Ubicacion</label><input name="location" value="${esc(f.location)}" ${admin ? "" : "disabled"}></div>
              <div class="field span-2"><label>Descripcion</label><textarea name="description" ${admin ? "" : "disabled"}>${esc(f.description)}</textarea></div>
              <div class="field"><label>Tipo reporte</label><input value="${esc(f.reportType || "No informado")}" disabled></div>
              <div class="field"><label>Reportante</label><input value="${esc(f.reporter || "Anonimo")}" disabled></div>
              <div class="field"><label>Criterio accion</label><select name="actionCriteria" ${admin ? "" : "disabled"}>${actionCriteriaOptions(f.actionCriteria)}</select></div>
              <div class="field"><label>Dias usados</label><input value="${esc(calculateDaysUsed(f))}" disabled></div>
              <div class="field"><label>Correo asignacion</label><input value="${esc(f.assignedEmailAt || "No enviado")}" disabled></div>
              <div class="field"><label>Criticidad</label><select name="criticality" ${admin ? "" : "disabled"}>${options(["Critica", "Alta", "Media", "Baja"], f.criticality)}</select></div>
              <div class="field"><label>Prioridad</label><select name="priority" ${admin ? "" : "disabled"}>${options(["Alta", "Media", "Baja"], f.priority)}</select></div>
              <div class="field span-2"><label>Responsables</label>${peopleCheckboxes(ownerIds(f), "ownerIds", !admin)}</div>
              <div class="field"><label>Fecha limite</label><input type="date" name="dueDate" value="${esc(f.dueDate)}" ${admin ? "" : "disabled"}></div>
              <div class="field"><label>Estado</label><select name="status" ${canManage ? "" : "disabled"}>${options(["Nuevo", "Asignado", "En gestion", "Completado por responsable", "Observado", "Cerrado", "Vencido", "No procesable"], f.status)}</select></div>
              <div class="field span-2"><label>Comentarios</label><textarea name="comments">${esc(f.comments)}</textarea></div>
              <div class="field span-2"><label>Justificacion no procesable</label><textarea name="nonProcessableReason" placeholder="Indica por que este hallazgo no se gestionara">${esc(f.nonProcessableReason || "")}</textarea></div>
              <div class="actions span-2" style="justify-content:flex-start">
                ${canManage ? `<button class="btn" type="submit">Guardar cambios</button>` : ""}
                ${admin && ownerIds(f).length ? `<button class="btn secondary" type="button" data-action="send-assignment" data-id="${f.id}">${f.assignedEmailAt ? "Reenviar asignacion" : "Enviar asignacion"}</button>` : ""}
                ${admin && f.status !== "No procesable" ? `<button class="btn secondary" type="button" data-action="mark-non-processable" data-id="${f.id}">Marcar no procesable</button>` : ""}
                ${admin && f.status === "No procesable" ? `<button class="btn secondary" type="button" data-action="reactivate-finding" data-id="${f.id}">Reactivar</button>` : ""}
                ${admin && f.status === "Completado por responsable" ? `<button class="btn" type="button" data-action="approve" data-id="${f.id}">Aprobar cierre</button><button class="btn danger" type="button" data-action="observe" data-id="${f.id}">Observar</button>` : ""}
              </div>
            </form>
            <div class="grid">
              ${renderLinksPanel(f)}
              <section class="panel">
                <div class="panel-header"><h3>Evidencias</h3></div>
                ${state.evidenceMessage ? `<div class="notice">${esc(state.evidenceMessage)}</div>` : ""}
                <ul class="timeline">
                  ${f.evidence.map((e) => `<li><strong>${esc(e.uploadedAt)} · ${e.url ? `<a href="${esc(e.url)}" target="_blank" rel="noreferrer">${esc(e.name)}</a>` : esc(e.name)}</strong><br>${esc(e.note)}<br>Subido por ${esc(e.uploadedBy)}</li>`).join("") || `<li>Sin evidencia cargada.</li>`}
                </ul>
                ${canManage ? `
                  <div class="field" style="margin-top:12px"><label>Archivo de evidencia</label><input type="file" data-evidence-file></div>
                  <div class="field" style="margin-top:12px"><label>O enlace/manual</label><input data-evidence-name placeholder="https://..."></div>
                  <div class="field" style="margin-top:8px"><label>Nota de evidencia</label><textarea data-evidence-note placeholder="Describe la accion correctiva realizada"></textarea></div>
                  <button class="btn secondary" type="button" style="margin-top:10px" data-action="add-evidence" data-id="${f.id}">Subir evidencia</button>
                ` : ""}
              </section>
              <section class="panel">
                <div class="panel-header"><h3>Historial</h3></div>
                <ul class="timeline">
                  ${f.history.map((h) => `<li><strong>${esc(h.at)} · ${esc(h.actor)}</strong><br>${esc(h.detail)}</li>`).join("")}
                </ul>
              </section>
            </div>
          </div>
        </section>
      </div>
    `;
  }

  function renderLinksPanel(f) {
    const links = [
      f.initialPhoto ? `<a href="${esc(f.initialPhoto)}" target="_blank" rel="noreferrer">Ver adjunto original</a>` : "",
      f.evidenceName ? `<a href="${esc(f.evidenceName)}" target="_blank" rel="noreferrer">Ver evidencia importada</a>` : ""
    ].filter(Boolean);
    if (!links.length) return "";
    return `
      <section class="panel">
        <div class="panel-header"><h3>Adjuntos del Form</h3></div>
        <ul class="timeline">
          ${links.map((link) => `<li>${link}</li>`).join("")}
        </ul>
      </section>
    `;
  }

  function bindEvents() {
    document.querySelectorAll("[data-action='view']").forEach((button) => button.addEventListener("click", () => setView(button.dataset.view)));
    document.querySelectorAll("[data-action='logout']").forEach((button) => button.addEventListener("click", logoutUser));
    document.querySelectorAll("[data-filter]").forEach((input) => input.addEventListener("change", (e) => setFilter(e.target.dataset.filter, e.target.value)));
    document.querySelectorAll("[data-chart-toggle]").forEach((input) => input.addEventListener("change", (e) => {
      state.chartVisibility[e.target.dataset.chartToggle] = e.target.checked;
      render();
    }));
    document.querySelectorAll("[data-criterion-days]").forEach((input) => input.addEventListener("change", updateCriterion));
    document.querySelectorAll("[data-criterion-priority]").forEach((input) => input.addEventListener("change", updateCriterion));
    document.querySelectorAll("[data-person-field]").forEach((input) => input.addEventListener("change", updatePerson));
    document.querySelector("[data-action='clear-filters']")?.addEventListener("click", () => {
      state.filters = { site: "Todos", status: "Todos", criticality: "Todos", priority: "Todos", ownerId: "Todos", from: "", to: "" };
      render();
    });
    document.querySelectorAll("[data-action='open']").forEach((button) => button.addEventListener("click", () => {
      state.selectedId = button.dataset.id;
      state.formError = "";
      state.evidenceMessage = "";
      render();
    }));
    document.querySelectorAll("[data-action='delete-finding']").forEach((button) => button.addEventListener("click", deleteFinding));
    document.querySelector("[data-action='close-modal']")?.addEventListener("click", () => {
      state.selectedId = "";
      state.formError = "";
      state.evidenceMessage = "";
      render();
    });
    document.querySelector("[data-action='submit-report']")?.addEventListener("submit", submitInternalReport);
    document.querySelector("[data-action='new-finding']")?.addEventListener("click", createFinding);
    document.querySelector("[data-action='select-unassigned']")?.addEventListener("click", selectUnassignedFindings);
    document.querySelector("[data-action='bulk-assign']")?.addEventListener("click", bulkAssignFindings);
    document.querySelector("[data-action='save-finding']")?.addEventListener("submit", saveFindingForm);
    document.querySelector("[data-action='add-evidence']")?.addEventListener("click", addEvidence);
    document.querySelector("[data-action='approve']")?.addEventListener("click", approveFinding);
    document.querySelector("[data-action='observe']")?.addEventListener("click", observeFinding);
    document.querySelector("[data-action='send-assignment']")?.addEventListener("click", sendAssignmentEmail);
    document.querySelector("[data-action='mark-non-processable']")?.addEventListener("click", markNonProcessable);
    document.querySelector("[data-action='reactivate-finding']")?.addEventListener("click", reactivateFinding);
    document.querySelector("[data-action='export-findings']")?.addEventListener("click", exportFindingsCsv);
    document.querySelector("[data-action='sample-csv']")?.addEventListener("click", () => {
      document.querySelector("[data-import-csv]").value = "FORM-1006,2026-07-03,Edificio Norte,Piso 12,Linea de vida sin certificacion visible,https://ejemplo.cl/foto1\nFORM-1007,2026-07-03,Torre Sur,Acceso camion,Peaton circula sin segregacion de ruta,";
    });
    document.querySelector("[data-action='import-csv']")?.addEventListener("click", importCsv);
    document.querySelector("[data-action='import-google-sheets']")?.addEventListener("click", importGoogleSheets);
    document.querySelector("[data-action='check-backend']")?.addEventListener("click", checkBackend);
    document.querySelector("[data-action='check-auto-import']")?.addEventListener("click", checkAutoImport);
    document.querySelector("[data-action='check-google-sheets']")?.addEventListener("click", checkGoogleSheets);
    document.querySelector("[data-action='run-backend-reminders']")?.addEventListener("click", runBackendReminders);
    document.querySelector("[data-action='add-person']")?.addEventListener("click", addPerson);
    document.querySelector("[data-action='import-people']")?.addEventListener("click", importPeople);
    document.querySelector("[data-action='sample-people']")?.addEventListener("click", () => {
      document.querySelector("[data-people-csv]").value = "nombre,correo,area,rol,pin\nKarina Espinoza Ayala,karina.espinoza@constructoraterratunel.com,prevencion,admin,1234\nCarlos Romero Gutierrez,carlos.romero@constructoraterratunel.com,prevencion,usuario,1234\nJulio Febre Guerra,jfebre@iccingenieria.cl,prevencion,admin,1234";
    });
    document.querySelectorAll("[data-action='delete-person']").forEach((button) => button.addEventListener("click", deletePerson));
    document.querySelector("[data-action='reset-data']")?.addEventListener("click", resetData);
    document.querySelector("[data-import-file]")?.addEventListener("change", loadImportFile);
    document.querySelector("[data-people-file]")?.addEventListener("change", loadPeopleFile);
    document.querySelector("[data-action='send-test-emails']")?.addEventListener("click", sendTestEmails);
    document.querySelector("[data-action='generate-reminders']")?.addEventListener("click", generateReminders);
    document.querySelector("[data-action='save-settings']")?.addEventListener("click", saveSettings);
  }

  function logoutUser() {
    sessionStorage.removeItem(SESSION_KEY);
    state.currentUserId = "";
    state.view = USER_APP_MODE ? "report" : "dashboard";
    state.selectedId = "";
    state.formError = "";
    render();
  }

  function refreshOverdue() {
    let changed = false;
    state.data.findings.forEach((f) => {
      if (isOverdue(f) && !["Cerrado", "Completado por responsable", "Observado", "No procesable"].includes(f.status) && f.status !== "Vencido") {
        f.status = "Vencido";
        f.history.push(event("Sistema", "Marcado como vencido por superar fecha limite"));
        queueEmails(ownerIds(f), `Hallazgo vencido ${f.id}`, `${f.site} · ${f.location}`);
        changed = true;
      }
    });
    if (changed) saveData();
  }

  async function submitInternalReport(e) {
    e.preventDefault();
    const form = e.target;
    const submitButton = form.querySelector("button[type='submit']");
    const file = selectedReportFile(form);
    const site = form.querySelector("[data-report-field='site']")?.value || state.data.settings.defaultSite || defaultSettings.defaultSite;
    const location = form.querySelector("[data-report-field='location']")?.value.trim();
    const category = form.querySelector("[data-report-field='category']")?.value || "Condicion insegura";
    const description = form.querySelector("[data-report-field='description']")?.value.trim();
    const user = currentUser();
    const reporterName = form.querySelector("[data-report-field='reporterName']")?.value.trim() || user?.name || "Reportante terreno";
    const reporterEmail = form.querySelector("[data-report-field='reporterEmail']")?.value.trim() || user?.email || "";

    if (!site || !location || !category || !description) {
      state.reportMessage = "Completa los campos obligatorios 1, 2, 3 y 4 antes de enviar.";
      render();
      return;
    }
    if (file && file.size > 25 * 1024 * 1024) {
      state.reportMessage = "El adjunto supera 25 MB. Usa un archivo mas liviano.";
      render();
      return;
    }
    if (PUBLIC_REPORT_MODE) {
      if (!API_BASE_URL) {
        state.reportMessage = "No se puede enviar: backend no configurado.";
        render();
        return;
      }
      if (!remoteStateLoaded) {
        state.reportMessage = "Conectando con el servidor...";
        render();
        const loaded = await loadRemoteState({ render: false });
        if (!loaded) {
          state.reportMessage = "No se pudo conectar con el servidor. Intenta nuevamente.";
          render();
          return;
        }
      }
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Enviando...";
    }
    state.reportMessage = file ? "Guardando reporte y adjunto..." : "Guardando reporte...";

    const findingId = nextFindingId();
    let initialEvidence = null;
    try {
      if (file) {
        const base64 = await fileToBase64(file);
        initialEvidence = await uploadEvidenceToDatabase({
          findingId,
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          base64
        });
      }
    } catch (error) {
      state.reportMessage = `No se pudo guardar el adjunto: ${error.message}`;
      render();
      return;
    }

    const now = todayDate();
    const finding = {
      id: findingId,
      sheetRowId: `WEB-${Date.now()}`,
      createdAt: now,
      detectedAt: now,
      site,
      location,
      description: `[${category}] ${description}`,
      initialPhoto: initialEvidence?.url || "",
      criticality: "Media",
      priority: "Media",
      ownerId: "",
      ownerIds: [],
      dueDate: "",
      status: "Nuevo",
      comments: `Reportado por ${reporterName}${reporterEmail ? ` (${reporterEmail})` : ""}. Origen: formulario interno.`,
      evidence: initialEvidence
        ? [{ ...initialEvidence, note: "Adjunto inicial del reporte.", uploadedBy: reporterName, uploadedAt: now }]
        : [],
      closedAt: "",
      history: [event(reporterName, "Reporte creado desde formulario interno")]
    };

    state.data.findings.unshift(finding);
    if (PUBLIC_REPORT_MODE || USER_APP_MODE) {
      state.selectedId = "";
      state.reportMessage = `Reporte enviado correctamente. Codigo: ${finding.id}.`;
    } else {
      state.selectedId = finding.id;
      state.view = "findings";
      state.reportMessage = "";
    }
    const saved = await saveData();
    if ((PUBLIC_REPORT_MODE || USER_APP_MODE) && !saved) {
      state.reportMessage = "No se pudo guardar en el servidor. Intenta nuevamente.";
      render();
      return;
    }
    render();
  }

  function selectedReportFile(form) {
    return form.querySelector("[data-report-photo]")?.files?.[0]
      || form.querySelector("[data-report-video]")?.files?.[0]
      || form.querySelector("[data-report-file]")?.files?.[0]
      || null;
  }

  function createFinding() {
    const finding = {
      id: nextFindingId(),
      sheetRowId: `MANUAL-${Date.now()}`,
      createdAt: todayDate(),
      detectedAt: todayDate(),
      site: state.data.settings.defaultSite || defaultSettings.defaultSite,
      location: "Ubicacion pendiente",
      description: "Describe el hallazgo de seguridad.",
      initialPhoto: "",
      criticality: "Media",
      priority: "Media",
      ownerId: "",
      ownerIds: [],
      dueDate: todayDate(),
      status: "Nuevo",
      comments: "",
      evidence: [],
      closedAt: "",
      history: [event(currentUser().name, "Creado manualmente")]
    };
    state.data.findings.unshift(finding);
    state.selectedId = finding.id;
    saveData();
    render();
  }

  function nextFindingId() {
    const year = today.getFullYear();
    const max = state.data.findings.reduce((highest, finding) => {
      const match = String(finding.id || "").match(new RegExp(`^H-${year}-(\\d+)$`));
      return match ? Math.max(highest, Number(match[1])) : highest;
    }, 0);
    return `H-${year}-${String(max + 1).padStart(3, "0")}`;
  }

  function selectUnassignedFindings() {
    document.querySelectorAll("[data-bulk-id]").forEach((input) => {
      const finding = state.data.findings.find((item) => item.id === input.dataset.bulkId);
      input.checked = Boolean(finding && !ownerIds(finding).length && !["Cerrado", "No procesable"].includes(finding.status));
    });
  }

  function bulkAssignFindings() {
    const ids = Array.from(document.querySelectorAll("[data-bulk-id]:checked")).map((input) => input.dataset.bulkId);
    const selectedOwners = Array.from(document.querySelectorAll('input[name="bulkOwnerIds"]:checked')).map((input) => input.value);
    const actionCriteria = document.querySelector("[data-bulk-criterion]")?.value || "3 dias";
    if (!ids.length || !selectedOwners.length) return;

    let updated = 0;
    ids.forEach((id) => {
      const finding = state.data.findings.find((item) => item.id === id);
      if (!finding || ["Cerrado", "No procesable"].includes(finding.status)) return;
      setFindingOwners(finding, selectedOwners);
      finding.actionCriteria = actionCriteria;
      finding.priority = mapPriority(actionCriteria);
      finding.assignedEmailAt = todayDate();
      finding.dueDate = dueDateFromCriteria(finding.assignedEmailAt, actionCriteria);
      finding.status = finding.status === "Nuevo" || !finding.status ? "Asignado" : finding.status;
      finding.history.push(event("Sistema", `Asignacion masiva a ${ownerNames(finding)}. Plazo recalculado desde ${finding.assignedEmailAt}`));
      queueEmails(ownerIds(finding), `Nuevo hallazgo asignado ${finding.id}`, `${finding.site} · ${finding.location}. Fecha limite: ${finding.dueDate}`);
      updated += 1;
    });

    state.data.imports.unshift({ at: todayDate(), detail: `${updated} hallazgos asignados masivamente a ${selectedOwners.map(ownerName).join(", ")}.` });
    saveData();
    render();
  }

  function saveFindingForm(e) {
    e.preventDefault();
    const f = state.data.findings.find((item) => item.id === state.selectedId);
    const beforeOwners = ownerIds(f);
    const beforeStatus = f.status;
    const form = new FormData(e.target);
    const requestedStatus = form.get("status");
    const requestedReason = String(form.get("nonProcessableReason") || "").trim();
    if (requestedStatus === "No procesable" && !requestedReason) {
      state.formError = "Para marcar un hallazgo como no procesable debes ingresar una justificacion.";
      render();
      return;
    }
    state.formError = "";
    ["site", "location", "description", "detectedAt", "criticality", "priority", "dueDate", "status", "comments", "actionCriteria", "nonProcessableReason"].forEach((key) => {
      if (form.has(key)) f[key] = form.get(key);
    });
    if (form.has("ownerIds")) setFindingOwners(f, form.getAll("ownerIds"));
    if (form.has("actionCriteria")) {
      const criterion = getCriterion(f.actionCriteria);
      f.priority = criterion.priority;
      f.dueDate = dueDateFromCriteria(f.assignedEmailAt || todayDate(), f.actionCriteria);
    }
    if (ownerIds(f).length && f.status === "Nuevo") f.status = "Asignado";
    if (f.status === "Cerrado" && !f.closedAt) f.closedAt = todayDate();
    if (f.status === "No procesable") {
      f.closedAt = "";
      f.dueDate = "";
    }
    f.history.push(event(currentUser().name, "Actualizo datos del hallazgo"));
    if (!sameOwnerSet(beforeOwners, ownerIds(f)) && ownerIds(f).length) {
      applyAssignmentEmail(f, "Correo de asignacion enviado");
    }
    if (beforeStatus !== f.status) {
      f.history.push(event(currentUser().name, `Cambio estado de ${beforeStatus} a ${f.status}`));
    }
    saveData();
    render();
  }

  async function addEvidence(e) {
    const f = state.data.findings.find((item) => item.id === e.target.dataset.id);
    const file = document.querySelector("[data-evidence-file]")?.files?.[0];
    const manualValue = document.querySelector("[data-evidence-name]").value.trim();
    const note = document.querySelector("[data-evidence-note]").value.trim() || "Evidencia cargada para revision.";
    if (!file && !manualValue) {
      state.evidenceMessage = "Selecciona un archivo o pega un enlace de evidencia.";
      render();
      return;
    }
    if (file && file.size > 25 * 1024 * 1024) {
      state.evidenceMessage = "El archivo supera 25 MB. Sube un archivo mas liviano o pega un enlace.";
      render();
      return;
    }

    e.target.disabled = true;
    e.target.textContent = "Subiendo...";
    state.evidenceMessage = file ? "Guardando evidencia..." : "Guardando enlace de evidencia...";
    let evidence = manualValue
      ? { name: manualValue, url: isUrl(manualValue) ? manualValue : "", provider: "manual" }
      : { name: file?.name || "evidencia", url: "", provider: "manual" };

    if (file) {
      try {
        const base64 = await fileToBase64(file);
        evidence = await uploadEvidenceToDatabase({
          findingId: f.id,
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          base64
        });
      } catch (error) {
        state.evidenceMessage = `No se pudo guardar evidencia: ${error.message}`;
        render();
        return;
      }
    }

    const evidenceMessage = evidence.statusMessage || "Evidencia cargada correctamente.";
    const evidenceRecord = { ...evidence };
    delete evidenceRecord.statusMessage;
    f.evidence.push({ ...evidenceRecord, note, uploadedBy: currentUser().name, uploadedAt: todayDate() });
    f.status = currentUser().role === "admin" ? f.status : "Completado por responsable";
    f.history.push(event(currentUser().name, `Subio evidencia: ${evidence.name}`));
    queueAdminEmails(`Evidencia pendiente ${f.id}`, `${currentUser().name} cargo evidencia para revision en ${f.id}.`);
    state.formError = "";
    state.evidenceMessage = evidenceMessage;
    saveData();
    render();
  }

  async function uploadEvidenceToDatabase(payload) {
    if (!API_BASE_URL) throw new Error("backend no configurado");
    const response = await apiFetch("/api/evidence/file", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(await responseErrorMessage(response, "API Evidencias"));
    return response.json();
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || "").split(",")[1] || "");
      reader.onerror = () => reject(reader.error || new Error("No se pudo leer el archivo."));
      reader.readAsDataURL(file);
    });
  }

  function isUrl(value) {
    return /^https?:\/\//i.test(String(value || ""));
  }

  function approveFinding(e) {
    const f = state.data.findings.find((item) => item.id === e.target.dataset.id);
    f.status = "Cerrado";
    f.closedAt = todayDate();
    f.history.push(event(currentUser().name, "Cierre aprobado"));
    queueEmails(ownerIds(f), `Cierre aprobado ${f.id}`, "La evidencia fue validada y el hallazgo quedo cerrado.");
    saveData();
    render();
  }

  function observeFinding(e) {
    const f = state.data.findings.find((item) => item.id === e.target.dataset.id);
    f.status = "Observado";
    f.history.push(event(currentUser().name, "Evidencia observada; requiere correccion"));
    queueEmails(ownerIds(f), `Evidencia observada ${f.id}`, "Revisa el comentario del administrador y vuelve a cargar evidencia.");
    saveData();
    render();
  }

  function markNonProcessable(e) {
    const finding = state.data.findings.find((item) => item.id === e.target.dataset.id);
    if (!finding) return;
    const reason = document.querySelector('textarea[name="nonProcessableReason"]')?.value.trim() || "";
    if (!reason) {
      state.formError = "Para marcar un hallazgo como no procesable debes ingresar una justificacion.";
      render();
      return;
    }
    finding.status = "No procesable";
    finding.nonProcessableReason = reason;
    finding.dueDate = "";
    finding.closedAt = "";
    finding.history.push(event(currentUser().name, `Marcado como no procesable: ${reason}`));
    state.formError = "";
    saveData();
    render();
  }

  function reactivateFinding(e) {
    const finding = state.data.findings.find((item) => item.id === e.target.dataset.id);
    if (!finding) return;
    finding.status = ownerIds(finding).length ? "Asignado" : "Nuevo";
    finding.nonProcessableReason = "";
    if (ownerIds(finding).length && finding.assignedEmailAt) finding.dueDate = dueDateFromCriteria(finding.assignedEmailAt, finding.actionCriteria);
    finding.history.push(event(currentUser().name, "Hallazgo reactivado para gestion"));
    state.formError = "";
    saveData();
    render();
  }

  function queueEmail(userId, subject, body) {
    const person = state.data.people.find((p) => p.id === userId);
    if (!person) return;
    const email = {
      id: `mail-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      at: todayDate(),
      to: person.email,
      subject,
      body,
      status: API_BASE_URL ? "pending" : "simulated",
      provider: API_BASE_URL ? "backend" : "local",
      providerMessageId: "",
      errorMessage: ""
    };
    state.data.emails.unshift(email);
    dispatchEmail(email);
  }

  function queueEmails(userIds, subject, body) {
    [...new Set(userIds || [])].forEach((userId) => queueEmail(userId, subject, body));
  }

  function queueAdminEmails(subject, body) {
    queueEmails(state.data.people.filter((person) => person.role === "admin").map((person) => person.id), subject, body);
  }

  function sendTestEmails() {
    const recipients = state.data.people.filter((person) =>
      person.email
      && ["admin", "usuario"].includes(person.role)
      && !person.email.toLowerCase().endsWith("@empresa.cl")
    );
    if (!recipients.length) {
      state.formError = "No hay usuarios con correo para probar.";
      render();
      return;
    }
    recipients.forEach((person) => {
      queueEmail(
        person.id,
        REAL_EMAIL_TEST_SUBJECT,
        `Hola ${person.name}. Este es un correo de prueba de la plataforma Hallazgos de Seguridad para Aduccion Lyon Valparaiso / Terratunel SpA.`
      );
    });
    state.data.imports.unshift({
      at: todayDate(),
      detail: `Prueba de correo enviada a ${recipients.length} usuario(s). Revisa estado en Alertas correo.`
    });
    state.formError = "";
    saveData();
    render();
  }

  async function dispatchEmail(email) {
    if (!API_BASE_URL) return;
    try {
      const response = await apiFetch("/api/emails/send", {
        method: "POST",
        body: JSON.stringify({ to: email.to, subject: email.subject, body: email.body })
      });
      if (!response.ok) throw new Error(await responseErrorMessage(response, "API correo"));
      const result = await response.json();
      updateEmailStatus(email.id, result);
    } catch (error) {
      updateEmailStatus(email.id, { status: "failed", provider: "backend", errorMessage: error.message });
    }
  }

  function updateEmailStatus(id, result) {
    const email = state.data.emails.find((item) => item.id === id);
    if (!email) return;
    email.status = result.status || "failed";
    email.provider = result.provider || email.provider || "";
    email.providerMessageId = result.providerMessageId || "";
    email.errorMessage = result.errorMessage || result.message || result.error || (email.status === "failed" ? "El backend marco el envio como fallido, pero no entrego detalle. Revisa Logs en Render." : "");
    saveData();
    if (state.view === "emails") render();
  }

  function emailStatusLabel(email) {
    const status = email.status || "simulated";
    if (status === "sent") return "Enviado";
    if (status === "simulated") return "Simulado";
    if (status === "pending") return "Pendiente";
    if (status === "failed") return "Fallido";
    return status;
  }

  function sendAssignmentEmail(e) {
    const finding = state.data.findings.find((item) => item.id === e.target.dataset.id);
    if (!finding || !ownerIds(finding).length) return;
    applyAssignmentEmail(finding, finding.assignedEmailAt ? "Correo de asignacion reenviado" : "Correo de asignacion enviado");
    saveData();
    render();
  }

  function applyAssignmentEmail(finding, historyText) {
    finding.assignedEmailAt = todayDate();
    finding.dueDate = dueDateFromCriteria(finding.assignedEmailAt, finding.actionCriteria);
    if (finding.status === "Nuevo") finding.status = "Asignado";
    queueEmails(ownerIds(finding), `Nuevo hallazgo asignado ${finding.id}`, `${finding.site} - ${finding.location}. Fecha limite: ${finding.dueDate}`);
    finding.history.push(event("Sistema", `${historyText} a ${ownerNames(finding)}. Plazo recalculado desde ${finding.assignedEmailAt}`));
  }

  function exportFindingsCsv() {
    const rows = filteredFindings();
    const header = ["id", "obra", "ubicacion", "descripcion", "criticidad", "prioridad", "criterio_accion", "responsable", "correo_asignacion", "dias_usados", "fecha_limite", "semaforo_plazo", "estado", "justificacion_no_procesable", "fecha_cierre", "evidencias"];
    const body = rows.map((finding) => [
      finding.id,
      finding.site,
      finding.location,
      finding.description,
      finding.criticality,
      finding.priority,
      finding.actionCriteria,
      ownerNames(finding),
      finding.assignedEmailAt || "",
      calculateDaysUsed(finding),
      finding.dueDate || "",
      deadlineStatus(finding),
      finding.status,
      finding.nonProcessableReason || "",
      finding.closedAt || "",
      finding.evidence.map((item) => item.name).join(" | ")
    ]);
    const csv = [header, ...body].map((row) => row.map(csvCell).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `hallazgos-seguridad-${todayDate()}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function csvCell(value) {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
  }

  function updateCriterion(e) {
    const id = e.target.dataset.criterionDays || e.target.dataset.criterionPriority;
    const criterion = state.data.actionCriteria.find((item) => item.id === id);
    if (!criterion) return;
    if (e.target.dataset.criterionDays) criterion.days = Math.max(0, Number(e.target.value || 0));
    if (e.target.dataset.criterionPriority) criterion.priority = e.target.value;
    saveData();
  }

  function updatePerson(e) {
    const person = state.data.people.find((item) => item.id === e.target.dataset.personId);
    if (!person) return;
    person[e.target.dataset.personField] = e.target.value.trim();
    saveData();
    render();
  }

  function generateReminders() {
    let created = 0;
    state.data.findings.forEach((finding) => {
      if (!ownerIds(finding).length || finding.status === "Cerrado" || finding.status === "No procesable") return;
      const dueDate = finding.dueDate ? new Date(finding.dueDate + "T00:00:00") : null;
      if (!dueDate) return;
      const daysToDue = Math.ceil((dueDate - today) / 86400000);
      if (daysToDue < 0) {
        queueEmails(ownerIds(finding), `Recordatorio vencido ${finding.id}`, `${finding.location}: vencio el ${finding.dueDate}.`);
        finding.history.push(event("Sistema", "Recordatorio de vencimiento enviado"));
        created += 1;
      } else if (daysToDue <= 3) {
        queueEmails(ownerIds(finding), `Recordatorio proximo vencimiento ${finding.id}`, `${finding.location}: vence el ${finding.dueDate}.`);
        finding.history.push(event("Sistema", "Recordatorio preventivo enviado"));
        created += 1;
      }
    });
    state.data.imports.unshift({ at: todayDate(), detail: `${created} recordatorios generados.` });
    saveData();
    render();
  }

  function importCsv() {
    const text = document.querySelector("[data-import-csv]").value.trim();
    if (!text) return;
    const existing = new Set(state.data.findings.map((f) => f.sheetRowId));
    let imported = 0;
    const rows = parseCsv(text).filter((row) => row.some(Boolean));
    const header = rows[0] || [];
    const hasHeader = header.some((cell) => normalizeHeader(cell).includes("marca temporal") || normalizeHeader(cell).includes("describe lo observado"));
    const records = hasHeader ? rows.slice(1).map((row, index) => mapGoogleFormRow(header, row, index)) : rows.map(mapSimpleRow);
    records.forEach((record) => {
      if (!record.sheetRowId || existing.has(record.sheetRowId)) return;
      const findingId = nextFindingId();
      const ownerIdsForRecord = resolveOwners(record.responsible);
      const status = record.closedAt ? "Cerrado" : ownerIdsForRecord.length ? "Asignado" : "Nuevo";
      const assignedEmailAt = ownerIdsForRecord.length ? todayDate() : "";
      const dueDate = assignedEmailAt ? dueDateFromCriteria(assignedEmailAt, record.actionCriteria) : "";
      state.data.findings.unshift({
        id: findingId,
        sheetRowId: record.sheetRowId,
        createdAt: todayDate(),
        detectedAt: record.detectedAt || todayDate(),
        site: normalizeSite(record.site),
        location: record.location || "Sin ubicacion",
        description: record.description || "Sin descripcion",
        initialPhoto: record.initialPhoto || "",
        evidenceName: record.evidenceName || "",
        reportType: record.reportType || "",
        reporter: record.reporter || "",
        actionCriteria: record.actionCriteria || "",
        criticality: record.criticality || "Media",
        priority: record.priority || "Media",
        ownerId: ownerIdsForRecord[0] || "",
        ownerIds: ownerIdsForRecord,
        assignedEmailAt,
        dueDate,
        status,
        comments: record.comments || "Importado desde planilla historica.",
        evidence: record.evidenceName ? [{ name: record.evidenceName, uploadedBy: ownerIdsForRecord.map(ownerName).join(", ") || "Sin asignar", uploadedAt: record.closedAt || todayDate(), note: "Evidencia importada desde Google Sheet." }] : [],
        closedAt: record.closedAt || "",
        history: [
          event("Sistema", "Importado desde CSV de Google Sheets"),
          ...(ownerIdsForRecord.length ? [event("Sistema", `Responsables asignados y correo enviado: ${ownerIdsForRecord.map(ownerName).join(", ")}`)] : []),
          ...(record.closedAt ? [event("Sistema", "Cierre importado desde planilla")] : [])
        ]
      });
      if (ownerIdsForRecord.length && !record.closedAt) queueEmails(ownerIdsForRecord, `Nuevo hallazgo asignado ${findingId}`, `${record.location || "Sin ubicacion"}. Fecha limite: ${dueDate}`);
      existing.add(record.sheetRowId);
      imported += 1;
    });
    state.data.imports.unshift({ at: todayDate(), detail: `${imported} hallazgos nuevos importados; duplicados omitidos.` });
    saveData();
    render();
  }

  async function importGoogleSheets() {
    if (!API_BASE_URL) {
      addImportLog("Configura config.js con apiBaseUrl para importar automaticamente desde Google Sheets.");
      return;
    }
    try {
      const response = await apiFetch("/api/import/google-sheets", { method: "POST" });
      if (!response.ok) throw new Error(await responseErrorMessage(response, "API"));
      state.data = migrateData(await response.json());
      remoteStateLoaded = true;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
      render();
    } catch (error) {
      addImportLog(`No se pudo importar automaticamente desde Google Sheets: ${error.message}`);
    }
  }

  async function checkBackend() {
    if (!API_BASE_URL) {
      addImportLog("Backend no configurado. Edita config.js y define apiBaseUrl.");
      return;
    }
    try {
      const response = await apiFetch("/api/health");
      if (!response.ok) throw new Error(await responseErrorMessage(response, "API"));
      const payload = await response.json();
      const storage = payload.storage?.provider || "desconocido";
      const mailer = payload.mailer?.provider || "sin correo";
      const importStatus = Number(payload.autoImportMinutes || 0) ? `autoimport ${payload.autoImportMinutes} min` : "autoimport off";
      const reminderStatus = Number(payload.autoReminderMinutes || 0) ? `recordatorios ${payload.autoReminderMinutes} min` : "recordatorios off";
      addImportLog(`Backend conectado: ${payload.service || "API"} OK. Storage: ${storage}. Correo: ${mailer}. Evidencias internas. ${importStatus}. ${reminderStatus}.`);
    } catch (error) {
      addImportLog(`Backend no responde: ${error.message}.`);
    }
  }

  async function checkAutoImport() {
    if (!API_BASE_URL) {
      addImportLog("No se puede revisar autoimportacion sin backend configurado.");
      return;
    }
    try {
      const response = await apiFetch("/api/health");
      if (!response.ok) throw new Error(await responseErrorMessage(response, "API"));
      const payload = await response.json();
      const minutes = Number(payload.autoImportMinutes || 0);
      if (!minutes) {
        addImportLog("Autoimportacion desactivada. Configura AUTO_IMPORT_MINUTES en el backend.");
        return;
      }
      const last = payload.lastAutoImport
        ? `${payload.lastAutoImport.ok ? "OK" : "fallo"} ${payload.lastAutoImport.at || ""}${payload.lastAutoImport.error ? `: ${payload.lastAutoImport.error}` : ""}`
        : "sin ejecuciones registradas";
      addImportLog(`Autoimportacion activa cada ${minutes} minutos. Ultimo intento: ${last}.`);
    } catch (error) {
      addImportLog(`No se pudo revisar autoimportacion: ${error.message}.`);
    }
  }

  async function checkGoogleSheets() {
    if (!API_BASE_URL) {
      addImportLog("No se puede probar GSheet sin backend configurado en config.js.");
      return;
    }
    try {
      const statusResponse = await apiFetch("/api/google-sheets/status");
      if (!statusResponse.ok) throw new Error(await responseErrorMessage(statusResponse, "API status"));
      const status = await statusResponse.json();
      if (!status.configured) {
        addImportLog("Backend responde, pero Google Sheets no esta configurado. Revisa GOOGLE_SHEET_ID y credenciales.");
        return;
      }
      const previewResponse = await apiFetch("/api/google-sheets/preview");
      if (!previewResponse.ok) throw new Error(await responseErrorMessage(previewResponse, "API preview"));
      const preview = await previewResponse.json();
      const headers = (preview.headers || []).slice(0, 5).join(" | ");
      addImportLog(`GSheet conectada: ${preview.rowCount || 0} filas detectadas. Encabezados: ${headers || "sin encabezados"}.`);
    } catch (error) {
      addImportLog(`No se pudo probar GSheet: ${error.message}.`);
    }
  }

  async function runBackendReminders() {
    if (!API_BASE_URL) {
      addImportLog("No se pueden generar recordatorios backend sin API configurada.");
      return;
    }
    try {
      const response = await apiFetch("/api/jobs/reminders", { method: "POST" });
      if (!response.ok) throw new Error(await responseErrorMessage(response, "API"));
      const payload = await response.json();
      state.data = migrateData(payload.state || state.data);
      remoteStateLoaded = true;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
      addImportLog(`Recordatorios backend procesados: ${payload.created || 0}.`);
    } catch (error) {
      addImportLog(`No se pudieron generar recordatorios backend: ${error.message}.`);
    }
  }

  function addImportLog(detail) {
    state.data.imports.unshift({ at: todayDate(), detail });
    saveData();
    render();
  }

  function apiFetch(path, options = {}) {
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    if (API_TOKEN) headers.Authorization = `Bearer ${API_TOKEN}`;
    return fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  }

  async function responseErrorMessage(response, label) {
    try {
      const payload = await response.clone().json();
      const detail = payload.message || payload.error || "";
      return `${label} ${response.status}${detail ? `: ${detail}` : ""}`;
    } catch (error) {
      return `${label} ${response.status}`;
    }
  }

  function importPeople() {
    const text = document.querySelector("[data-people-csv]")?.value.trim();
    if (!text) return;
    const rows = parseCsv(text).filter((row) => row.some(Boolean));
    if (!rows.length) return;
    const header = rows[0] || [];
    const hasHeader = header.some((cell) => ["nombre", "name", "correo", "email", "area", "rol", "role", "pin"].includes(normalizeHeader(cell)));
    const records = hasHeader ? rows.slice(1).map((row) => mapPersonRow(header, row)) : rows.map(mapSimplePersonRow);
    let created = 0;
    let updated = 0;
    records.forEach((record) => {
      if (!record.name) return;
      const existing = findExistingPerson(record);
      if (existing) {
        existing.name = record.name || existing.name;
        existing.email = record.email || existing.email;
        existing.area = record.area || existing.area;
        existing.role = record.role || existing.role;
        existing.pin = record.pin || existing.pin || "1234";
        updated += 1;
      } else {
        state.data.people.push({
          id: uniquePersonId(record.name),
          name: record.name,
          email: record.email || `${normalizeHeader(record.name).replace(/[^a-z0-9]+/g, ".")}@empresa.cl`,
          area: record.area || "Obra",
          role: record.role || "usuario",
          pin: record.pin || "1234"
        });
        created += 1;
      }
    });
    state.data.imports.unshift({ at: todayDate(), detail: `${created} personas creadas; ${updated} personas actualizadas.` });
    saveData();
    render();
  }

  function mapPersonRow(header, row) {
    const value = (names) => {
      const aliases = Array.isArray(names) ? names : [names];
      const index = header.findIndex((cell) => aliases.includes(normalizeHeader(cell)));
      return index >= 0 ? String(row[index] || "").trim() : "";
    };
    return normalizePersonRecord({
      name: value(["nombre", "name", "responsable"]),
      email: value(["correo", "email", "mail"]),
      area: value(["area", "cargo", "especialidad"]),
      role: value(["rol", "role", "perfil"]),
      pin: value(["pin", "clave", "password"])
    });
  }

  function mapSimplePersonRow(row) {
    return normalizePersonRecord({ name: row[0], email: row[1], area: row[2], role: row[3], pin: row[4] });
  }

  function normalizePersonRecord(record) {
    const normalizedRole = normalizeHeader(record.role);
    const role = normalizedRole === "admin" || normalizedRole.includes("administrador") ? "admin" : "usuario";
    return {
      name: String(record.name || "").trim(),
      email: String(record.email || "").trim(),
      area: String(record.area || "Obra").trim(),
      role,
      pin: String(record.pin || "").trim()
    };
  }

  function findExistingPerson(record) {
    const email = normalizeHeader(record.email);
    const name = normalizeHeader(record.name);
    return state.data.people.find((person) => (email && normalizeHeader(person.email) === email) || normalizeHeader(person.name) === name);
  }

  function uniquePersonId(name) {
    const base = `u-${normalizeHeader(name).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || Date.now()}`;
    let id = base;
    let index = 2;
    while (state.data.people.some((person) => person.id === id)) {
      id = `${base}-${index}`;
      index += 1;
    }
    return id;
  }

  function deletePerson(e) {
    const id = e.target.dataset.personId;
    const person = state.data.people.find((item) => item.id === id);
    if (!person) return;
    const adminCount = state.data.people.filter((item) => item.role === "admin").length;
    if (id === state.currentUserId) {
      alert("No puedes eliminar la cuenta que esta activa en este momento.");
      return;
    }
    if (person.role === "admin" && adminCount <= 1) {
      alert("Debe quedar al menos un administrador.");
      return;
    }
    const assigned = state.data.findings.filter((finding) => hasOwner(finding, id));
    const message = assigned.length
      ? `${person.name} tiene ${assigned.length} hallazgos asignados. Al eliminarla quedaran sin responsable para reasignacion.`
      : `Eliminar a ${person.name} del directorio.`;
    if (!confirm(message)) return;
    assigned.forEach((finding) => {
      setFindingOwners(finding, ownerIds(finding).filter((ownerId) => ownerId !== id));
      if (!ownerIds(finding).length && (finding.status === "Asignado" || finding.status === "En gestion" || finding.status === "Vencido")) finding.status = "Nuevo";
      finding.history.push(event(currentUser().name, `Responsable eliminado del directorio: ${person.name}`));
    });
    state.data.people = state.data.people.filter((item) => item.id !== id);
    if (state.filters.ownerId === id) state.filters.ownerId = "Todos";
    state.data.imports.unshift({ at: todayDate(), detail: `Persona eliminada: ${person.name}. Hallazgos liberados: ${assigned.length}.` });
    saveData();
    render();
  }

  function loadImportFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      document.querySelector("[data-import-csv]").value = String(reader.result || "");
    };
    reader.readAsText(file, "utf-8");
  }

  function loadPeopleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      document.querySelector("[data-people-csv]").value = reader.result;
    };
    reader.readAsText(file, "utf-8");
  }

  function mapSimpleRow(row) {
    const [sheetRowId, detectedAt, site, location, description, initialPhoto] = row;
    return { sheetRowId, detectedAt: normalizeDate(detectedAt), site, location, description, initialPhoto };
  }

  function mapGoogleFormRow(header, row, index) {
    const value = (name) => {
      const target = normalizeHeader(name);
      const col = header.findIndex((cell) => normalizeHeader(cell).includes(target));
      return col >= 0 ? (row[col] || "").trim() : "";
    };
    const timestamp = value("marca temporal");
    const reportType = value("que estas reportando");
    const location = value("donde ocurrio");
    const description = value("describe lo observado");
    const initialPhoto = value("adjunta");
    const reporter = value("dinos si deseas");
    const severity = value("gravedad");
    const actionCriteria = normalizeActionCriteria(value("criterio de accion"));
    const responsible = value("responsable");
    const closeDate = value("fecha cierre");
    const evidenceName = value("evidencia");
    const detectedAt = normalizeDate(timestamp);
    return {
      sheetRowId: `FORM-${timestamp || index + 1}-${description}`.replace(/\s+/g, "-").slice(0, 90),
      detectedAt,
      site: state.data.settings.defaultSite || defaultSettings.defaultSite,
      location,
      description,
      initialPhoto,
      reportType,
      reporter,
      criticality: mapCriticality(severity),
      priority: mapPriority(actionCriteria),
      actionCriteria,
      responsible,
      dueDate: "",
      closedAt: normalizeDate(closeDate),
      evidenceName,
      comments: "Importado desde planilla historica."
    };
  }

  function normalizeHeader(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[¿?]/g, "")
      .toLowerCase()
      .trim();
  }

  function normalizeDate(value) {
    const text = String(value || "").trim();
    if (!text) return "";
    const datePart = text.split(" ")[0];
    const slash = datePart.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slash) return `${slash[3]}-${slash[2].padStart(2, "0")}-${slash[1].padStart(2, "0")}`;
    const dash = datePart.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/);
    if (dash) {
      const year = dash[3].length === 2 ? `20${dash[3]}` : dash[3];
      return `${year}-${dash[2].padStart(2, "0")}-${dash[1].padStart(2, "0")}`;
    }
    return text;
  }

  function mapCriticality(value) {
    const normalized = normalizeHeader(value);
    if (normalized.includes("critico")) return "Critica";
    if (normalized.includes("serio")) return "Alta";
    if (normalized.includes("leve") || normalized.includes("bajo")) return "Baja";
    return "Media";
  }

  function mapPriority(value) {
    return getCriterion(normalizeActionCriteria(value)).priority;
  }

  function dueDateFromCriteria(date, criteria) {
    if (!date) return "";
    const days = getCriterion(normalizeActionCriteria(criteria)).days;
    const due = new Date(date + "T00:00:00");
    due.setDate(due.getDate() + days);
    return due.toISOString().slice(0, 10);
  }

  function normalizeActionCriteria(value) {
    const normalized = normalizeHeader(value);
    if (normalized.includes("inmediato") || normalized.includes("inmediata")) return "inmediata";
    if (normalized.includes("3 dia")) return "3 dias";
    if (normalized.includes("1 semana") || normalized.includes("7 dia")) return "1 semana";
    if (normalized.includes("2 semana") || normalized.includes("14 dia")) return "2 semanas";
    return value || "3 dias";
  }

  function resolveOwners(value) {
    return [...new Set(String(value || "")
      .split(/[;,]/)
      .map((item) => resolveExistingOwner(item))
      .filter(Boolean))];
  }

  function resolveExistingOwner(nameOrEmail) {
    const cleaned = String(nameOrEmail || "").trim();
    if (!cleaned) return "";
    const normalized = normalizeHeader(cleaned);
    const existing = assignmentPeople().find((p) =>
      normalizeHeader(p.name) === normalized
      || normalizeHeader(p.email) === normalized
    );
    return existing ? existing.id : "";
  }

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let cur = "";
    let quoted = false;
    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      const next = text[i + 1];
      if (char === '"' && quoted && next === '"') {
        cur += '"';
        i += 1;
      } else if (char === '"') {
        quoted = !quoted;
      } else if (char === "," && !quoted) {
        row.push(cur.trim());
        cur = "";
      } else if ((char === "\n" || char === "\r") && !quoted) {
        if (char === "\r" && next === "\n") i += 1;
        row.push(cur.trim());
        rows.push(row);
        row = [];
        cur = "";
      } else {
        cur += char;
      }
    }
    row.push(cur.trim());
    rows.push(row);
    return rows;
  }

  function parseCsvLine(line) {
    const out = [];
    let cur = "";
    let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      if (char === '"') quoted = !quoted;
      else if (char === "," && !quoted) {
        out.push(cur.trim());
        cur = "";
      } else cur += char;
    }
    out.push(cur.trim());
    return out;
  }

  function addPerson() {
    const index = state.data.people.length + 1;
    const person = { id: `u-nuevo-${Date.now()}`, name: `Usuario ${index}`, role: "usuario", email: `usuario${index}@empresa.cl`, area: "Obra", pin: "1234" };
    state.data.people.push(person);
    saveData();
    render();
  }

  function resetData() {
    state.data = { findings: [], people: people.map((person) => ({ ...person })), emails: [], imports: [], actionCriteria: defaultActionCriteria.map((criterion) => ({ ...criterion })), settings: { ...defaultSettings, sites: [...defaultSettings.sites] } };
    state.selectedId = "";
    saveData();
    render();
  }

  function deleteFinding(e) {
    const user = currentUser();
    if (!user || user.role !== "admin") return;
    const id = e.currentTarget.dataset.id;
    const finding = state.data.findings.find((item) => item.id === id);
    if (!finding) return;
    if (!confirm(`Eliminar definitivamente el hallazgo ${finding.id}?`)) return;
    state.data.findings = state.data.findings.filter((item) => item.id !== id);
    state.data.imports.unshift({
      at: todayDate(),
      detail: `Hallazgo ${finding.id} eliminado por ${user.name}.`
    });
    if (state.selectedId === id) state.selectedId = "";
    saveData();
    render();
  }

  function saveSettings() {
    document.querySelectorAll("[data-setting]").forEach((input) => {
      if (input.dataset.setting === "sitesText") {
        const sites = input.value.split(/\r?\n/).map((site) => site.trim()).filter(Boolean);
        state.data.settings.sites = sites.length ? sites : [...defaultSettings.sites];
      } else {
        state.data.settings[input.dataset.setting] = input.value.trim();
      }
    });
    if (!state.data.settings.sites.includes(state.data.settings.defaultSite)) {
      state.data.settings.defaultSite = state.data.settings.sites[0];
    }
    saveData();
    render();
  }

  async function initialize() {
    if (API_BASE_URL) {
      renderBoot("Conectando con servidor productivo...");
      await loadRemoteState({ render: false });
    }
    render();
  }

  initialize();
})();
