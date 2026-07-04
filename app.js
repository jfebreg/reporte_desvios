(function () {
  const STORAGE_KEY = "obraSafetyFindings.v1";
  const today = new Date("2026-07-03T12:00:00");
  const API_BASE_URL = (window.REPORTE_DESVIOS_CONFIG && window.REPORTE_DESVIOS_CONFIG.apiBaseUrl || "").replace(/\/$/, "");
  const API_TOKEN = window.REPORTE_DESVIOS_CONFIG && window.REPORTE_DESVIOS_CONFIG.apiToken || "";
  let remoteStateLoaded = false;

  const people = [
    { id: "u-admin", name: "Carolina Rivas", role: "admin", email: "carolina.rivas@empresa.cl", area: "Prevencion" },
    { id: "u-juan", name: "Juan Perez", role: "usuario", email: "juan.perez@empresa.cl", area: "Terreno" },
    { id: "u-maria", name: "Maria Soto", role: "usuario", email: "maria.soto@empresa.cl", area: "Calidad" },
    { id: "u-diego", name: "Diego Morales", role: "usuario", email: "diego.morales@empresa.cl", area: "Subcontratos" }
  ];

  const defaultActionCriteria = [
    { id: "inmediata", label: "inmediata", days: 0, priority: "Alta" },
    { id: "3-dias", label: "3 dias", days: 3, priority: "Media" },
    { id: "1-semana", label: "1 semana", days: 7, priority: "Baja" },
    { id: "2-semanas", label: "2 semanas", days: 14, priority: "Baja" }
  ];

  const defaultSettings = {
    formUrl: "https://forms.google.com/",
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
    view: "dashboard",
    currentUserId: "u-admin",
    filters: { site: "Todos", status: "Todos", criticality: "Todos", priority: "Todos", ownerId: "Todos", from: "", to: "" },
    chartVisibility: { status: true, criticality: true, priority: true, compliance: true, trend: true, progress: true, pendingOwners: true, slowOwners: true, avgResolve: true, deadline: true, upcoming: true, nonProcessable: true },
    selectedId: "",
    formError: "",
    data: loadData()
  };

  function event(actor, detail) {
    return { at: today.toISOString().slice(0, 10), actor, detail };
  }

  function loadData() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return migrateData(JSON.parse(raw));
    return { findings: seedFindings, people, emails: [], imports: [], actionCriteria: defaultActionCriteria, settings: defaultSettings };
  }

  function migrateData(data) {
    data.people = data.people || people;
    data.people.forEach((person) => {
      if (person.role === "manager") person.role = "usuario";
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
      if (!data.settings.sites.includes(finding.site)) finding.site = data.settings.defaultSite;
    });
    return data;
  }

  function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
    saveRemoteState();
  }

  async function loadRemoteState() {
    if (!API_BASE_URL || remoteStateLoaded) return;
    try {
      const response = await apiFetch("/api/state");
      if (!response.ok) throw new Error(`API ${response.status}`);
      state.data = migrateData(await response.json());
      remoteStateLoaded = true;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
      render();
    } catch (error) {
      console.warn("No se pudo cargar backend productivo; se usa respaldo local.", error);
    }
  }

  async function saveRemoteState() {
    if (!API_BASE_URL || !remoteStateLoaded) return;
    try {
      await apiFetch("/api/state", {
        method: "PUT",
        body: JSON.stringify(state.data)
      });
    } catch (error) {
      console.warn("No se pudo guardar en backend productivo; se mantiene respaldo local.", error);
    }
  }

  function currentUser() {
    return state.data.people.find((p) => p.id === state.currentUserId) || state.data.people[0];
  }

  function visibleFindings() {
    const user = currentUser();
    return state.data.findings.filter((finding) => user.role === "admin" || finding.ownerId === user.id);
  }

  function filteredFindings() {
    return visibleFindings().filter((finding) => {
      const f = state.filters;
      if (f.site !== "Todos" && finding.site !== f.site) return false;
      if (f.status !== "Todos" && finding.status !== f.status) return false;
      if (f.criticality !== "Todos" && finding.criticality !== f.criticality) return false;
      if (f.priority !== "Todos" && finding.priority !== f.priority) return false;
      if (f.ownerId !== "Todos" && finding.ownerId !== f.ownerId) return false;
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

  function badgeClass(value) {
    return String(value).toLowerCase().replace(/\s+/g, "-").replace("critica", "critica").replace("en-gestion", "gestion").replace("completado-por-responsable", "gestion");
  }

  function setView(view) {
    state.view = view;
    state.selectedId = "";
    state.formError = "";
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

  function personOptions(selected, includeAll) {
    const users = state.data.people.filter((p) => p.role === "usuario");
    const base = includeAll ? [{ id: "Todos", name: "Todos" }] : [{ id: "", name: "Sin asignar" }];
    return base.concat(users).map((p) => `<option value="${esc(p.id)}" ${p.id === selected ? "selected" : ""}>${esc(p.name)}</option>`).join("");
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
    const endDate = finding.closedAt || today.toISOString().slice(0, 10);
    return `${daysBetween(finding.assignedEmailAt, endDate)} dias`;
  }

  function render() {
    refreshOverdue();
    const user = currentUser();
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
            <select data-action="switch-user">${state.data.people.map((p) => `<option value="${p.id}" ${p.id === user.id ? "selected" : ""}>${esc(p.name)} · ${p.role === "admin" ? "Admin" : "Usuario"}</option>`).join("")}</select>
          </div>
          <nav class="nav">
            ${navButton("dashboard", "Dashboard")}
            ${navButton("report", "Reportar")}
            ${navButton("findings", "Hallazgos")}
            ${user.role === "admin" ? navButton("import", "Importar Sheets") : ""}
            ${user.role === "admin" ? navButton("people", "Personas") : ""}
            ${navButton("emails", "Alertas correo")}
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

  function navButton(view, label) {
    return `<button class="${state.view === view ? "active" : ""}" data-action="view" data-view="${view}">${label}</button>`;
  }

  function renderView() {
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
        ${state.chartVisibility.compliance ? barChart("Cumplimiento por responsable", groupCount(items.filter((f) => f.status === "Cerrado"), (f) => ownerName(f.ownerId))) : ""}
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
    return barChart("Responsables con pendientes", groupCount(pending, (f) => ownerName(f.ownerId)));
  }

  function slowOwnersRanking(items) {
    const closed = items.filter((f) => f.status === "Cerrado" && f.assignedEmailAt && f.closedAt);
    const grouped = {};
    closed.forEach((finding) => {
      const owner = ownerName(finding.ownerId);
      grouped[owner] = grouped[owner] || [];
      grouped[owner].push(daysBetween(finding.assignedEmailAt, finding.closedAt));
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
              <span>${esc(ownerName(finding.ownerId))} · ${esc(finding.location)}</span>
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
    const formUrl = state.data.settings.formUrl || defaultSettings.formUrl;
    return `
      ${renderTop("Reportar", "Acceso directo al formulario oficial de reporte en terreno.", `<a class="btn" href="${esc(formUrl)}" target="_blank" rel="noreferrer">Abrir Google Form</a>`)}
      <section class="grid two-col">
        <div class="panel">
          <div class="panel-header"><h3>Formulario de reporte</h3></div>
          <p class="plain-text">Usa este acceso para levantar nuevos hallazgos desde terreno. Los registros ingresan por Google Form, pasan a Sheets y luego se importan a esta web para asignacion y seguimiento.</p>
          <div class="field">
            <label>Link del Google Form</label>
            <input type="url" value="${esc(formUrl)}" data-setting="formUrl" placeholder="https://forms.gle/...">
          </div>
          <div class="field" style="margin-top:12px">
            <label>Obra por defecto</label>
            <select data-setting="defaultSite">${options(siteCatalog(), state.data.settings.defaultSite || defaultSettings.defaultSite)}</select>
          </div>
          <div class="field" style="margin-top:12px">
            <label>Listado de obras</label>
            <textarea data-setting="sitesText">${esc(siteCatalog().join("\n"))}</textarea>
          </div>
          <div class="actions" style="justify-content:flex-start;margin-top:12px">
            <button class="btn secondary" data-action="save-settings">Guardar link</button>
            <a class="btn" href="${esc(formUrl)}" target="_blank" rel="noreferrer">Abrir Form</a>
          </div>
        </div>
        <div class="panel">
          <div class="panel-header"><h3>Flujo esperado</h3></div>
          <ul class="timeline">
            <li><strong>1. Reporte</strong><br>La persona reporta en Google Form.</li>
            <li><strong>2. Captura</strong><br>Google Sheets recibe la respuesta.</li>
            <li><strong>3. Gestion</strong><br>La web importa, asigna responsable y controla vencimientos.</li>
            <li><strong>4. Cierre</strong><br>El responsable carga evidencia y administrador valida.</li>
          </ul>
        </div>
      </section>
    `;
  }

  function renderFindings() {
    const user = currentUser();
    const items = filteredFindings();
    const actions = `${user.role === "admin" ? `<button class="btn" data-action="new-finding">Nuevo hallazgo</button>` : ""}<button class="btn secondary" data-action="export-findings">Exportar CSV</button>`;
    return `
      ${renderTop("Hallazgos", user.role === "admin" ? "Clasifica, asigna, revisa evidencias y cierra hallazgos." : "Gestiona tus hallazgos asignados y sube evidencia.", actions)}
      ${renderFilters()}
      <section class="panel">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Obra</th><th>Ubicacion</th><th>Criticidad</th><th>Prioridad</th><th>Responsable</th><th>Vence</th><th>Plazo</th><th>Estado</th><th></th>
              </tr>
            </thead>
            <tbody>
              ${items.map((f) => `
                <tr>
                  <td><strong>${esc(f.id)}</strong></td>
                  <td>${esc(f.site)}</td>
                  <td>${esc(f.location)}</td>
                  <td><span class="badge ${badgeClass(f.criticality)}">${esc(f.criticality)}</span></td>
                  <td><span class="badge ${badgeClass(f.priority)}">${esc(f.priority)}</span></td>
                  <td>${esc(ownerName(f.ownerId))}</td>
                  <td>${esc(f.dueDate)}</td>
                  <td><span class="badge ${badgeClass(deadlineStatus(f))}">${esc(deadlineStatus(f))}</span></td>
                  <td><span class="badge ${badgeClass(f.status)}">${esc(f.status)}</span>${f.status === "No procesable" && f.nonProcessableReason ? `<div class="muted-note">${esc(f.nonProcessableReason)}</div>` : ""}</td>
                  <td><button class="btn secondary" data-action="open" data-id="${esc(f.id)}">Abrir</button></td>
                </tr>
              `).join("") || `<tr><td colspan="10" class="empty">No hay hallazgos para estos filtros</td></tr>`}
            </tbody>
          </table>
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
          </div>
        </div>
        <div class="panel">
          <div class="notice">Acepta el CSV original de Google Forms con encabezados o el formato simple: sheetRowId,fecha,obra,ubicacion,descripcion,foto</div>
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
          <div class="notice">Formato recomendado: nombre,correo,area,rol. Si el correo o nombre ya existe, se actualiza.</div>
          <div class="field" style="margin-top:12px">
            <label>Listado CSV</label>
            <textarea data-people-csv placeholder="nombre,correo,area,rol&#10;Mauricio Munoz,mauricio@empresa.cl,Produccion,usuario&#10;Karina Espinoza,karina@empresa.cl,Prevencion,usuario"></textarea>
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
          <table>
            <thead><tr><th>Acciones</th><th>Nombre</th><th>Correo</th><th>Area</th><th>Rol</th><th>Pendientes</th></tr></thead>
            <tbody>
              ${state.data.people.map((p) => `
                <tr>
                  <td><button class="btn danger compact" data-action="delete-person" data-person-id="${esc(p.id)}">Eliminar</button></td>
                  <td><input value="${esc(p.name)}" data-person-field="name" data-person-id="${esc(p.id)}"></td>
                  <td><input type="email" value="${esc(p.email)}" data-person-field="email" data-person-id="${esc(p.id)}"></td>
                  <td><input value="${esc(p.area)}" data-person-field="area" data-person-id="${esc(p.id)}"></td>
                  <td><select data-person-field="role" data-person-id="${esc(p.id)}">${options(["admin", "usuario"], p.role)}</select></td>
                  <td>${visibleFindings().filter((finding) => finding.ownerId === p.id && finding.status !== "Cerrado").length}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </section>
      <section class="panel">
        <div class="panel-header"><h3>Criterios de accion configurables</h3></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Criterio</th><th>Plazo en dias</th><th>Prioridad sugerida</th></tr></thead>
            <tbody>
              ${state.data.actionCriteria.map((criterion) => `
                <tr>
                  <td><strong>${esc(criterion.label)}</strong></td>
                  <td><input type="number" min="0" value="${esc(criterion.days)}" data-criterion-days="${esc(criterion.id)}"></td>
                  <td><select data-criterion-priority="${esc(criterion.id)}">${options(["Alta", "Media", "Baja"], criterion.priority)}</select></td>
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
      ${renderTop("Alertas de correo", "Bandeja de salida simulada para asignaciones, vencimientos, observaciones y cierres.", `<button class="btn" data-action="generate-reminders">Generar recordatorios</button>`)}
      <section class="panel">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Fecha</th><th>Para</th><th>Asunto</th><th>Detalle</th></tr></thead>
            <tbody>
              ${state.data.emails.map((mail) => `
                <tr><td>${esc(mail.at)}</td><td>${esc(mail.to)}</td><td><strong>${esc(mail.subject)}</strong></td><td>${esc(mail.body)}</td></tr>
              `).join("") || `<tr><td colspan="4" class="empty">Aun no hay correos simulados.</td></tr>`}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  function renderFindingModal(id) {
    const f = state.data.findings.find((item) => item.id === id);
    const user = currentUser();
    const admin = user.role === "admin";
    const canManage = admin || f.ownerId === user.id;
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
              <div class="field"><label>Responsable</label><select name="ownerId" ${admin ? "" : "disabled"}>${personOptions(f.ownerId, false)}</select></div>
              <div class="field"><label>Fecha limite</label><input type="date" name="dueDate" value="${esc(f.dueDate)}" ${admin ? "" : "disabled"}></div>
              <div class="field"><label>Estado</label><select name="status" ${canManage ? "" : "disabled"}>${options(["Nuevo", "Asignado", "En gestion", "Completado por responsable", "Observado", "Cerrado", "Vencido", "No procesable"], f.status)}</select></div>
              <div class="field span-2"><label>Comentarios</label><textarea name="comments">${esc(f.comments)}</textarea></div>
              <div class="field span-2"><label>Justificacion no procesable</label><textarea name="nonProcessableReason" placeholder="Indica por que este hallazgo no se gestionara">${esc(f.nonProcessableReason || "")}</textarea></div>
              <div class="actions span-2" style="justify-content:flex-start">
                ${canManage ? `<button class="btn" type="submit">Guardar cambios</button>` : ""}
                ${admin && f.ownerId ? `<button class="btn secondary" type="button" data-action="send-assignment" data-id="${f.id}">${f.assignedEmailAt ? "Reenviar asignacion" : "Enviar asignacion"}</button>` : ""}
                ${admin && f.status !== "No procesable" ? `<button class="btn secondary" type="button" data-action="mark-non-processable" data-id="${f.id}">Marcar no procesable</button>` : ""}
                ${admin && f.status === "No procesable" ? `<button class="btn secondary" type="button" data-action="reactivate-finding" data-id="${f.id}">Reactivar</button>` : ""}
                ${admin && f.status === "Completado por responsable" ? `<button class="btn" type="button" data-action="approve" data-id="${f.id}">Aprobar cierre</button><button class="btn danger" type="button" data-action="observe" data-id="${f.id}">Observar</button>` : ""}
              </div>
            </form>
            <div class="grid">
              ${renderLinksPanel(f)}
              <section class="panel">
                <div class="panel-header"><h3>Evidencias</h3></div>
                <ul class="timeline">
                  ${f.evidence.map((e) => `<li><strong>${esc(e.uploadedAt)} · ${esc(e.name)}</strong><br>${esc(e.note)}<br>Subido por ${esc(e.uploadedBy)}</li>`).join("") || `<li>Sin evidencia cargada.</li>`}
                </ul>
                ${canManage ? `
                  <div class="field" style="margin-top:12px"><label>Nombre archivo o enlace Drive</label><input data-evidence-name placeholder="foto-correccion.jpg"></div>
                  <div class="field" style="margin-top:8px"><label>Nota de evidencia</label><textarea data-evidence-note placeholder="Describe la accion correctiva realizada"></textarea></div>
                  <button class="btn secondary" style="margin-top:10px" data-action="add-evidence" data-id="${f.id}">Subir evidencia</button>
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
    document.querySelector("[data-action='switch-user']")?.addEventListener("change", (e) => {
      state.currentUserId = e.target.value;
      state.view = "dashboard";
      render();
    });
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
      render();
    }));
    document.querySelector("[data-action='close-modal']")?.addEventListener("click", () => {
      state.selectedId = "";
      state.formError = "";
      render();
    });
    document.querySelector("[data-action='new-finding']")?.addEventListener("click", createFinding);
    document.querySelector("[data-action='save-finding']")?.addEventListener("submit", saveFindingForm);
    document.querySelector("[data-action='add-evidence']")?.addEventListener("click", addEvidence);
    document.querySelector("[data-action='approve']")?.addEventListener("click", approveFinding);
    document.querySelector("[data-action='observe']")?.addEventListener("click", observeFinding);
    document.querySelector("[data-action='send-assignment']")?.addEventListener("click", sendAssignmentEmail);
    document.querySelector("[data-action='mark-non-processable']")?.addEventListener("click", markNonProcessable);
    document.querySelector("[data-action='reactivate-finding']")?.addEventListener("click", reactivateFinding);
    document.querySelector("[data-action='export-findings']")?.addEventListener("click", exportFindingsCsv);
    document.querySelector("[data-action='sample-csv']")?.addEventListener("click", () => {
      document.querySelector("[data-import-csv]").value = "FORM-1006,2026-07-03,Edificio Norte,Piso 12,Linea de vida sin certificacion visible,https://drive.google.com/foto1\nFORM-1007,2026-07-03,Torre Sur,Acceso camion,Peaton circula sin segregacion de ruta,";
    });
    document.querySelector("[data-action='import-csv']")?.addEventListener("click", importCsv);
    document.querySelector("[data-action='import-google-sheets']")?.addEventListener("click", importGoogleSheets);
    document.querySelector("[data-action='check-backend']")?.addEventListener("click", checkBackend);
    document.querySelector("[data-action='check-auto-import']")?.addEventListener("click", checkAutoImport);
    document.querySelector("[data-action='check-google-sheets']")?.addEventListener("click", checkGoogleSheets);
    document.querySelector("[data-action='add-person']")?.addEventListener("click", addPerson);
    document.querySelector("[data-action='import-people']")?.addEventListener("click", importPeople);
    document.querySelector("[data-action='sample-people']")?.addEventListener("click", () => {
      document.querySelector("[data-people-csv]").value = "nombre,correo,area,rol\nMauricio Munoz,mauricio.munoz@empresa.cl,Produccion,usuario\nRuben Maure,ruben.maure@empresa.cl,Terreno,usuario\nKarina Espinoza,karina.espinoza@empresa.cl,Prevencion,usuario\nJoaquin Atena,joaquin.atena@empresa.cl,Electricidad,usuario";
    });
    document.querySelectorAll("[data-action='delete-person']").forEach((button) => button.addEventListener("click", deletePerson));
    document.querySelector("[data-action='reset-data']")?.addEventListener("click", resetData);
    document.querySelector("[data-import-file]")?.addEventListener("change", loadImportFile);
    document.querySelector("[data-people-file]")?.addEventListener("change", loadPeopleFile);
    document.querySelector("[data-action='generate-reminders']")?.addEventListener("click", generateReminders);
    document.querySelector("[data-action='save-settings']")?.addEventListener("click", saveSettings);
  }

  function refreshOverdue() {
    let changed = false;
    state.data.findings.forEach((f) => {
      if (isOverdue(f) && !["Cerrado", "Completado por responsable", "Observado", "No procesable"].includes(f.status) && f.status !== "Vencido") {
        f.status = "Vencido";
        f.history.push(event("Sistema", "Marcado como vencido por superar fecha limite"));
        queueEmail(f.ownerId, `Hallazgo vencido ${f.id}`, `${f.site} · ${f.location}`);
        changed = true;
      }
    });
    if (changed) saveData();
  }

  function createFinding() {
    const next = String(state.data.findings.length + 1).padStart(3, "0");
    const finding = {
      id: `H-2026-${next}`,
      sheetRowId: `MANUAL-${Date.now()}`,
      createdAt: today.toISOString().slice(0, 10),
      detectedAt: today.toISOString().slice(0, 10),
      site: state.data.settings.defaultSite || defaultSettings.defaultSite,
      location: "Ubicacion pendiente",
      description: "Describe el hallazgo de seguridad.",
      initialPhoto: "",
      criticality: "Media",
      priority: "Media",
      ownerId: "",
      dueDate: today.toISOString().slice(0, 10),
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

  function saveFindingForm(e) {
    e.preventDefault();
    const f = state.data.findings.find((item) => item.id === state.selectedId);
    const beforeOwner = f.ownerId;
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
    ["site", "location", "description", "criticality", "priority", "ownerId", "dueDate", "status", "comments", "actionCriteria", "nonProcessableReason"].forEach((key) => {
      if (form.has(key)) f[key] = form.get(key);
    });
    if (form.has("actionCriteria")) {
      const criterion = getCriterion(f.actionCriteria);
      f.priority = criterion.priority;
      f.dueDate = dueDateFromCriteria(f.assignedEmailAt || today.toISOString().slice(0, 10), f.actionCriteria);
    }
    if (f.ownerId && f.status === "Nuevo") f.status = "Asignado";
    if (f.status === "Cerrado" && !f.closedAt) f.closedAt = today.toISOString().slice(0, 10);
    if (f.status === "No procesable") {
      f.closedAt = "";
      f.dueDate = "";
    }
    f.history.push(event(currentUser().name, "Actualizo datos del hallazgo"));
    if (beforeOwner !== f.ownerId && f.ownerId) {
      applyAssignmentEmail(f, "Correo de asignacion enviado");
    }
    if (beforeStatus !== f.status) {
      f.history.push(event(currentUser().name, `Cambio estado de ${beforeStatus} a ${f.status}`));
    }
    saveData();
    render();
  }

  function addEvidence(e) {
    const f = state.data.findings.find((item) => item.id === e.target.dataset.id);
    const name = document.querySelector("[data-evidence-name]").value.trim() || "evidencia-drive";
    const note = document.querySelector("[data-evidence-note]").value.trim() || "Evidencia cargada para revision.";
    f.evidence.push({ name, note, uploadedBy: currentUser().name, uploadedAt: today.toISOString().slice(0, 10) });
    f.status = currentUser().role === "admin" ? f.status : "Completado por responsable";
    f.history.push(event(currentUser().name, `Subio evidencia: ${name}`));
    queueEmail("u-admin", `Evidencia pendiente ${f.id}`, `${ownerName(f.ownerId)} cargo evidencia para revision.`);
    saveData();
    render();
  }

  function approveFinding(e) {
    const f = state.data.findings.find((item) => item.id === e.target.dataset.id);
    f.status = "Cerrado";
    f.closedAt = today.toISOString().slice(0, 10);
    f.history.push(event(currentUser().name, "Cierre aprobado"));
    queueEmail(f.ownerId, `Cierre aprobado ${f.id}`, "La evidencia fue validada y el hallazgo quedo cerrado.");
    saveData();
    render();
  }

  function observeFinding(e) {
    const f = state.data.findings.find((item) => item.id === e.target.dataset.id);
    f.status = "Observado";
    f.history.push(event(currentUser().name, "Evidencia observada; requiere correccion"));
    queueEmail(f.ownerId, `Evidencia observada ${f.id}`, "Revisa el comentario del administrador y vuelve a cargar evidencia.");
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
    finding.status = finding.ownerId ? "Asignado" : "Nuevo";
    finding.nonProcessableReason = "";
    if (finding.ownerId && finding.assignedEmailAt) finding.dueDate = dueDateFromCriteria(finding.assignedEmailAt, finding.actionCriteria);
    finding.history.push(event(currentUser().name, "Hallazgo reactivado para gestion"));
    state.formError = "";
    saveData();
    render();
  }

  function queueEmail(userId, subject, body) {
    const person = state.data.people.find((p) => p.id === userId);
    if (!person) return;
    state.data.emails.unshift({ at: today.toISOString().slice(0, 10), to: person.email, subject, body });
  }

  function sendAssignmentEmail(e) {
    const finding = state.data.findings.find((item) => item.id === e.target.dataset.id);
    if (!finding || !finding.ownerId) return;
    applyAssignmentEmail(finding, finding.assignedEmailAt ? "Correo de asignacion reenviado" : "Correo de asignacion enviado");
    saveData();
    render();
  }

  function applyAssignmentEmail(finding, historyText) {
    finding.assignedEmailAt = today.toISOString().slice(0, 10);
    finding.dueDate = dueDateFromCriteria(finding.assignedEmailAt, finding.actionCriteria);
    if (finding.status === "Nuevo") finding.status = "Asignado";
    queueEmail(finding.ownerId, `Nuevo hallazgo asignado ${finding.id}`, `${finding.site} · ${finding.location}. Fecha limite: ${finding.dueDate}`);
    finding.history.push(event("Sistema", `${historyText} a ${ownerName(finding.ownerId)}. Plazo recalculado desde ${finding.assignedEmailAt}`));
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
      ownerName(finding.ownerId),
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
    link.download = `hallazgos-seguridad-${today.toISOString().slice(0, 10)}.csv`;
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
      if (!finding.ownerId || finding.status === "Cerrado" || finding.status === "No procesable") return;
      const dueDate = finding.dueDate ? new Date(finding.dueDate + "T00:00:00") : null;
      if (!dueDate) return;
      const daysToDue = Math.ceil((dueDate - today) / 86400000);
      if (daysToDue < 0) {
        queueEmail(finding.ownerId, `Recordatorio vencido ${finding.id}`, `${finding.location}: vencio el ${finding.dueDate}.`);
        finding.history.push(event("Sistema", "Recordatorio de vencimiento enviado"));
        created += 1;
      } else if (daysToDue <= 3) {
        queueEmail(finding.ownerId, `Recordatorio proximo vencimiento ${finding.id}`, `${finding.location}: vence el ${finding.dueDate}.`);
        finding.history.push(event("Sistema", "Recordatorio preventivo enviado"));
        created += 1;
      }
    });
    state.data.imports.unshift({ at: today.toISOString().slice(0, 10), detail: `${created} recordatorios generados.` });
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
      const next = String(state.data.findings.length + 1).padStart(3, "0");
      const ownerId = resolveOwner(record.responsible);
      const status = record.closedAt ? "Cerrado" : ownerId ? "Asignado" : "Nuevo";
      const assignedEmailAt = ownerId ? today.toISOString().slice(0, 10) : "";
      const dueDate = assignedEmailAt ? dueDateFromCriteria(assignedEmailAt, record.actionCriteria) : "";
      state.data.findings.unshift({
        id: `H-2026-${next}`,
        sheetRowId: record.sheetRowId,
        createdAt: today.toISOString().slice(0, 10),
        detectedAt: record.detectedAt || today.toISOString().slice(0, 10),
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
        ownerId,
        assignedEmailAt,
        dueDate,
        status,
        comments: record.comments || "Importado desde Google Forms.",
        evidence: record.evidenceName ? [{ name: record.evidenceName, uploadedBy: ownerName(ownerId), uploadedAt: record.closedAt || today.toISOString().slice(0, 10), note: "Evidencia importada desde Google Sheet." }] : [],
        closedAt: record.closedAt || "",
        history: [
          event("Sistema", "Importado desde CSV de Google Sheets"),
          ...(ownerId ? [event("Sistema", `Responsable asignado y correo enviado: ${ownerName(ownerId)}`)] : []),
          ...(record.closedAt ? [event("Sistema", "Cierre importado desde planilla")] : [])
        ]
      });
      if (ownerId && !record.closedAt) queueEmail(ownerId, `Nuevo hallazgo asignado H-2026-${next}`, `${record.location || "Sin ubicacion"}. Fecha limite: ${dueDate}`);
      existing.add(record.sheetRowId);
      imported += 1;
    });
    state.data.imports.unshift({ at: today.toISOString().slice(0, 10), detail: `${imported} hallazgos nuevos importados; duplicados omitidos.` });
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
      if (!response.ok) throw new Error(`API ${response.status}`);
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
      if (!response.ok) throw new Error(`API ${response.status}`);
      const payload = await response.json();
      addImportLog(`Backend conectado: ${payload.service || "API"} OK.`);
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
      if (!response.ok) throw new Error(`API ${response.status}`);
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
      if (!statusResponse.ok) throw new Error(`API status ${statusResponse.status}`);
      const status = await statusResponse.json();
      if (!status.configured) {
        addImportLog("Backend responde, pero Google Sheets no esta configurado. Revisa GOOGLE_SHEET_ID y credenciales.");
        return;
      }
      const previewResponse = await apiFetch("/api/google-sheets/preview");
      if (!previewResponse.ok) throw new Error(`API preview ${previewResponse.status}`);
      const preview = await previewResponse.json();
      const headers = (preview.headers || []).slice(0, 5).join(" | ");
      addImportLog(`GSheet conectada: ${preview.rowCount || 0} filas detectadas. Encabezados: ${headers || "sin encabezados"}.`);
    } catch (error) {
      addImportLog(`No se pudo probar GSheet: ${error.message}.`);
    }
  }

  function addImportLog(detail) {
    state.data.imports.unshift({ at: today.toISOString().slice(0, 10), detail });
    saveData();
    render();
  }

  function apiFetch(path, options = {}) {
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    if (API_TOKEN) headers.Authorization = `Bearer ${API_TOKEN}`;
    return fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  }

  function importPeople() {
    const text = document.querySelector("[data-people-csv]")?.value.trim();
    if (!text) return;
    const rows = parseCsv(text).filter((row) => row.some(Boolean));
    if (!rows.length) return;
    const header = rows[0] || [];
    const hasHeader = header.some((cell) => ["nombre", "name", "correo", "email", "area", "rol", "role"].includes(normalizeHeader(cell)));
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
        updated += 1;
      } else {
        state.data.people.push({
          id: uniquePersonId(record.name),
          name: record.name,
          email: record.email || `${normalizeHeader(record.name).replace(/[^a-z0-9]+/g, ".")}@empresa.cl`,
          area: record.area || "Obra",
          role: record.role || "usuario"
        });
        created += 1;
      }
    });
    state.data.imports.unshift({ at: today.toISOString().slice(0, 10), detail: `${created} personas creadas; ${updated} personas actualizadas.` });
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
      role: value(["rol", "role", "perfil"])
    });
  }

  function mapSimplePersonRow(row) {
    return normalizePersonRecord({ name: row[0], email: row[1], area: row[2], role: row[3] });
  }

  function normalizePersonRecord(record) {
    const normalizedRole = normalizeHeader(record.role);
    const role = normalizedRole === "admin" || normalizedRole.includes("administrador") ? "admin" : "usuario";
    return {
      name: String(record.name || "").trim(),
      email: String(record.email || "").trim(),
      area: String(record.area || "Obra").trim(),
      role
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
    const assigned = state.data.findings.filter((finding) => finding.ownerId === id);
    const message = assigned.length
      ? `${person.name} tiene ${assigned.length} hallazgos asignados. Al eliminarla quedaran sin responsable para reasignacion.`
      : `Eliminar a ${person.name} del directorio.`;
    if (!confirm(message)) return;
    assigned.forEach((finding) => {
      finding.ownerId = "";
      if (finding.status === "Asignado" || finding.status === "En gestion" || finding.status === "Vencido") finding.status = "Nuevo";
      finding.history.push(event(currentUser().name, `Responsable eliminado del directorio: ${person.name}`));
    });
    state.data.people = state.data.people.filter((item) => item.id !== id);
    if (state.filters.ownerId === id) state.filters.ownerId = "Todos";
    state.data.imports.unshift({ at: today.toISOString().slice(0, 10), detail: `Persona eliminada: ${person.name}. Hallazgos liberados: ${assigned.length}.` });
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
      comments: "Importado desde Google Forms."
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

  function resolveOwner(name) {
    const cleaned = String(name || "").split(",")[0].trim();
    if (!cleaned) return "";
    const normalized = normalizeHeader(cleaned);
    const existing = state.data.people.find((p) => normalizeHeader(p.name) === normalized);
    if (existing) return existing.id;
    const id = `u-${normalized.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || Date.now()}`;
    const person = { id, name: cleaned, role: "usuario", email: `${id.replace(/^u-/, "")}@empresa.cl`, area: "Obra" };
    state.data.people.push(person);
    return id;
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
    const person = { id: `u-nuevo-${Date.now()}`, name: `Usuario ${index}`, role: "usuario", email: `usuario${index}@empresa.cl`, area: "Obra" };
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

  render();
  loadRemoteState();
})();
