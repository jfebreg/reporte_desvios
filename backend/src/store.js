const fs = require("node:fs/promises");
const path = require("node:path");

const DATA_DIR = path.join(__dirname, "..", "data");
const STATE_FILE = path.join(DATA_DIR, "state.json");

const emptyState = {
  findings: [],
  people: [
    { id: "u-admin", name: "Administrador", role: "admin", email: "admin@empresa.cl", area: "Prevencion" }
  ],
  emails: [],
  imports: [],
  actionCriteria: [
    { id: "inmediata", label: "inmediata", days: 0, priority: "Alta" },
    { id: "3-dias", label: "3 dias", days: 3, priority: "Media" },
    { id: "1-semana", label: "1 semana", days: 7, priority: "Baja" },
    { id: "2-semanas", label: "2 semanas", days: 14, priority: "Baja" }
  ],
  settings: {
    formUrl: "https://forms.google.com/",
    defaultSite: "Aduccion Lyon Valparaiso / Terratunel SpA",
    sites: ["Aduccion Lyon Valparaiso / Terratunel SpA"]
  }
};

async function readState() {
  try {
    const raw = await fs.readFile(STATE_FILE, "utf8");
    return normalizeState(JSON.parse(raw));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    return structuredClone(emptyState);
  }
}

async function writeState(state) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STATE_FILE, JSON.stringify(normalizeState(state), null, 2), "utf8");
}

function normalizeState(state) {
  return {
    ...emptyState,
    ...state,
    findings: state.findings || [],
    people: state.people || emptyState.people,
    emails: state.emails || [],
    imports: state.imports || [],
    actionCriteria: state.actionCriteria || emptyState.actionCriteria,
    settings: { ...emptyState.settings, ...(state.settings || {}) }
  };
}

module.exports = { readState, writeState };
