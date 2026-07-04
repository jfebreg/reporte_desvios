const { getAccessToken } = require("./googleAuth");

const DEFAULT_SITE = "Aduccion Lyon Valparaiso / Terratunel SpA";

async function importFromGoogleSheets(state) {
  const values = await readSheetValues();
  if (values.length < 2) return withImport(state, "Google Sheets sin filas nuevas.");

  const header = values[0];
  const existing = new Set((state.findings || []).map((finding) => finding.sheetRowId));
  let imported = 0;

  values.slice(1).forEach((row, index) => {
    const record = mapRow(header, row, index + 2);
    if (!record.sheetRowId || existing.has(record.sheetRowId)) return;

    const ownerId = resolveOwner(state, record.responsible);
    const sequence = String((state.findings || []).length + 1).padStart(3, "0");
    const assignedEmailAt = ownerId ? todayIso() : "";
    const dueDate = assignedEmailAt ? dueDateFromCriteria(state, assignedEmailAt, record.actionCriteria) : "";

    state.findings.unshift({
      id: `H-2026-${sequence}`,
      sheetRowId: record.sheetRowId,
      createdAt: todayIso(),
      detectedAt: record.detectedAt || todayIso(),
      site: record.site || state.settings?.defaultSite || DEFAULT_SITE,
      location: record.location || "Sin ubicacion",
      description: record.description || "Sin descripcion",
      initialPhoto: record.initialPhoto || "",
      evidenceName: record.evidenceName || "",
      reportType: record.reportType || "",
      reporter: record.reporter || "",
      actionCriteria: record.actionCriteria || "3 dias",
      criticality: record.criticality || "Media",
      priority: record.priority || "Media",
      ownerId,
      assignedEmailAt,
      dueDate,
      status: ownerId ? "Asignado" : "Nuevo",
      comments: "Importado automaticamente desde Google Sheets API.",
      evidence: [],
      closedAt: "",
      nonProcessableReason: "",
      history: [
        event("Sistema", "Importado automaticamente desde Google Sheets API"),
        ...(ownerId ? [event("Sistema", `Responsable asignado: ${ownerName(state, ownerId)}`)] : [])
      ]
    });
    existing.add(record.sheetRowId);
    imported += 1;
  });

  return withImport(state, `${imported} hallazgos importados automaticamente desde Google Sheets API.`);
}

async function previewGoogleSheets() {
  const values = await readSheetValues();
  const header = values[0] || [];
  const rows = values.slice(1, 6);
  return {
    ok: true,
    configured: true,
    sheetId: mask(process.env.GOOGLE_SHEET_ID),
    range: process.env.GOOGLE_SHEET_RANGE || "Respuestas de formulario 1!A:Z",
    headers: header,
    sampleRows: rows,
    rowCount: Math.max(values.length - 1, 0)
  };
}

function getGoogleSheetsStatus() {
  return {
    configured: Boolean(process.env.GOOGLE_SHEET_ID && (process.env.GOOGLE_SERVICE_ACCOUNT_JSON || (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY))),
    sheetId: mask(process.env.GOOGLE_SHEET_ID),
    range: process.env.GOOGLE_SHEET_RANGE || "Respuestas de formulario 1!A:Z",
    hasServiceAccountJson: Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
    hasClientEmail: Boolean(process.env.GOOGLE_CLIENT_EMAIL),
    hasPrivateKey: Boolean(process.env.GOOGLE_PRIVATE_KEY)
  };
}

async function readSheetValues() {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const range = process.env.GOOGLE_SHEET_RANGE || "Respuestas de formulario 1!A:Z";
  if (!sheetId) throw new Error("Falta GOOGLE_SHEET_ID en backend/.env");

  const token = await getAccessToken();
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(range)}`;
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`Google Sheets API fallo ${response.status}: ${await response.text()}`);

  const payload = await response.json();
  return payload.values || [];
}

function mapRow(header, row, rowNumber) {
  const get = (...names) => {
    const index = header.findIndex((name) => names.some((candidate) => normalize(name).includes(normalize(candidate))));
    return index >= 0 ? String(row[index] || "").trim() : "";
  };
  const timestamp = get("marca temporal", "timestamp", "fecha");
  const description = get("describe lo observado", "descripcion", "descripción", "hallazgo");
  const location = get("ubicacion", "ubicación", "sector", "lugar");
  const responsible = get("responsable", "asignado");
  const actionCriteria = normalizeActionCriteria(get("criterio", "accion", "acción", "plazo"));

  return {
    sheetRowId: get("id", "folio", "codigo") || `SHEET-${rowNumber}`,
    detectedAt: normalizeDate(timestamp),
    site: get("obra") || DEFAULT_SITE,
    location,
    description,
    initialPhoto: get("foto", "imagen", "archivo"),
    reportType: get("tipo"),
    reporter: get("reportante", "correo", "email"),
    responsible,
    actionCriteria,
    criticality: mapCriticality(get("criticidad", "gravedad")),
    priority: priorityFromCriteria(actionCriteria),
    evidenceName: get("evidencia"),
    closedAt: normalizeDate(get("cierre", "fecha cierre"))
  };
}

function resolveOwner(state, name) {
  const cleaned = String(name || "").split(",")[0].trim();
  if (!cleaned) return "";
  const normalized = normalize(cleaned);
  const existing = (state.people || []).find((person) => normalize(person.name) === normalized);
  if (existing) return existing.id;
  const id = uniquePersonId(state, cleaned);
  state.people.push({
    id,
    name: cleaned,
    role: "usuario",
    email: `${id.replace(/^u-/, "")}@empresa.cl`,
    area: "Obra"
  });
  return id;
}

function uniquePersonId(state, name) {
  const base = `u-${normalize(name).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || Date.now()}`;
  let id = base;
  let index = 2;
  while ((state.people || []).some((person) => person.id === id)) {
    id = `${base}-${index}`;
    index += 1;
  }
  return id;
}

function dueDateFromCriteria(state, date, criteria) {
  const normalized = normalizeActionCriteria(criteria);
  const criterion = (state.actionCriteria || []).find((item) => normalize(item.label) === normalize(normalized));
  const due = new Date(`${date}T00:00:00`);
  due.setDate(due.getDate() + Number(criterion?.days || 3));
  return due.toISOString().slice(0, 10);
}

function normalizeActionCriteria(value) {
  const normalized = normalize(value);
  if (normalized.includes("inmediato") || normalized.includes("inmediata")) return "inmediata";
  if (normalized.includes("3 dia")) return "3 dias";
  if (normalized.includes("1 semana") || normalized.includes("7 dia")) return "1 semana";
  if (normalized.includes("2 semana") || normalized.includes("14 dia")) return "2 semanas";
  return value || "3 dias";
}

function priorityFromCriteria(criteria) {
  const normalized = normalizeActionCriteria(criteria);
  if (normalized === "inmediata") return "Alta";
  if (normalized === "3 dias") return "Media";
  return "Baja";
}

function mapCriticality(value) {
  const normalized = normalize(value);
  if (normalized.includes("critico") || normalized.includes("critica")) return "Critica";
  if (normalized.includes("serio") || normalized.includes("alta")) return "Alta";
  if (normalized.includes("leve") || normalized.includes("baja")) return "Baja";
  return "Media";
}

function normalizeDate(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const slash = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (slash) return `${slash[3].length === 2 ? `20${slash[3]}` : slash[3]}-${slash[2].padStart(2, "0")}-${slash[1].padStart(2, "0")}`;
  return todayIso();
}

function withImport(state, detail) {
  state.imports = state.imports || [];
  state.imports.unshift({ at: todayIso(), detail });
  return state;
}

function ownerName(state, id) {
  return (state.people || []).find((person) => person.id === id)?.name || "Sin asignar";
}

function event(actor, detail) {
  return { at: todayIso(), actor, detail };
}

function mask(value) {
  const text = String(value || "");
  if (!text) return "";
  if (text.length <= 10) return "***";
  return `${text.slice(0, 4)}...${text.slice(-4)}`;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function normalize(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

module.exports = { importFromGoogleSheets, getGoogleSheetsStatus, previewGoogleSheets };
