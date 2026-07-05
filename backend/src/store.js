const fs = require("node:fs/promises");
const path = require("node:path");

const DATA_DIR = path.join(__dirname, "..", "data");
const STATE_FILE = path.join(DATA_DIR, "state.json");
let pgPool = null;

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
  if (usePostgres()) return readPostgresState();
  try {
    const raw = await fs.readFile(STATE_FILE, "utf8");
    return normalizeState(JSON.parse(raw));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    return structuredClone(emptyState);
  }
}

async function writeState(state) {
  if (usePostgres()) return writePostgresState(state);
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STATE_FILE, JSON.stringify(normalizeState(state), null, 2), "utf8");
}

function getStorageStatus() {
  return {
    provider: usePostgres() ? "postgres" : "json",
    configured: usePostgres(),
    file: usePostgres() ? "" : STATE_FILE
  };
}

function usePostgres() {
  return Boolean(process.env.DATABASE_URL);
}

async function readPostgresState() {
  const pool = getPgPool();
  await ensurePostgresSchema(pool);
  const result = await pool.query("select state from app_state where key = $1", ["main"]);
  if (!result.rows.length) return structuredClone(emptyState);
  return normalizeState(result.rows[0].state);
}

async function writePostgresState(state) {
  const pool = getPgPool();
  await ensurePostgresSchema(pool);
  await pool.query(
    `insert into app_state (key, state, updated_at)
     values ($1, $2::jsonb, now())
     on conflict (key)
     do update set state = excluded.state, updated_at = now()`,
    ["main", JSON.stringify(normalizeState(state))]
  );
}

async function ensurePostgresSchema(pool) {
  await pool.query(`
    create table if not exists app_state (
      key text primary key,
      state jsonb not null,
      updated_at timestamptz not null default now()
    )
  `);
}

function getPgPool() {
  if (pgPool) return pgPool;
  let Pool;
  try {
    ({ Pool } = require("pg"));
  } catch (error) {
    throw new Error("DATABASE_URL esta configurado, pero falta instalar dependencia pg. Ejecuta npm install.");
  }
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false }
  });
  return pgPool;
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

module.exports = { readState, writeState, getStorageStatus };
