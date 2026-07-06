const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");

const DATA_DIR = path.join(__dirname, "..", "data", "evidence");
let pgPool = null;

async function saveEvidenceFile({ fileName, mimeType, base64, findingId }) {
  if (!fileName || !base64) {
    throw new Error("Faltan nombre o contenido del archivo.");
  }

  const id = crypto.randomUUID();
  const safeName = `${findingId || "hallazgo"}-${Date.now()}-${fileName}`.replace(/[\\/:*?"<>|]+/g, "-");
  const buffer = Buffer.from(base64, "base64");
  const type = mimeType || "application/octet-stream";

  if (usePostgres()) {
    const pool = getPgPool();
    await ensurePostgresSchema(pool);
    await pool.query(
      `insert into evidence_files (id, file_name, mime_type, data, created_at)
       values ($1, $2, $3, $4, now())`,
      [id, safeName, type, buffer]
    );
  } else {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(path.join(DATA_DIR, `${id}.bin`), buffer);
    await fs.writeFile(
      path.join(DATA_DIR, `${id}.json`),
      JSON.stringify({ fileName: safeName, mimeType: type, createdAt: new Date().toISOString() }, null, 2),
      "utf8"
    );
  }

  return {
    evidenceFileId: id,
    name: safeName,
    mimeType: type,
    provider: usePostgres() ? "postgres" : "local"
  };
}

async function readEvidenceFile(id) {
  if (!id) return null;

  if (usePostgres()) {
    const pool = getPgPool();
    await ensurePostgresSchema(pool);
    const result = await pool.query(
      "select file_name, mime_type, data from evidence_files where id = $1",
      [id]
    );
    if (!result.rows.length) return null;
    const row = result.rows[0];
    return {
      fileName: row.file_name,
      mimeType: row.mime_type,
      buffer: row.data
    };
  }

  try {
    const meta = JSON.parse(await fs.readFile(path.join(DATA_DIR, `${id}.json`), "utf8"));
    const buffer = await fs.readFile(path.join(DATA_DIR, `${id}.bin`));
    return { fileName: meta.fileName, mimeType: meta.mimeType, buffer };
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

function usePostgres() {
  return Boolean(process.env.DATABASE_URL);
}

async function ensurePostgresSchema(pool) {
  await pool.query(`
    create table if not exists evidence_files (
      id text primary key,
      file_name text not null,
      mime_type text not null,
      data bytea not null,
      created_at timestamptz not null default now()
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

module.exports = { saveEvidenceFile, readEvidenceFile };
