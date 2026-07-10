const http = require("node:http");
const { URL } = require("node:url");
const { readState, writeState, getStorageStatus } = require("./src/store");
const { getMailerStatus, sendMail } = require("./src/mailer");
const { saveEvidenceFile, readEvidenceFile } = require("./src/evidenceStore");
const { runReminderJob } = require("./src/reminders");
const { loadEnv } = require("./src/env");

loadEnv();

const PORT = Number(process.env.PORT || 8787);
const APP_ORIGIN = process.env.APP_ORIGIN || "*";
const API_TOKEN = process.env.API_TOKEN || "";
const AUTO_REMINDER_MINUTES = Number(process.env.AUTO_REMINDER_MINUTES || 0);
let lastReminderRun = null;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "OPTIONS") {
    send(res, 204, "");
    return;
  }

  try {
    if (req.method === "GET" && url.pathname === "/api/health") {
      sendJson(res, 200, {
        ok: true,
        service: "reporte-desvios-api",
        auth: API_TOKEN ? "enabled" : "disabled",
        autoReminderMinutes: AUTO_REMINDER_MINUTES,
        lastAutoImport: null,
        lastReminderRun,
        mailer: getMailerStatus(),
        storage: getStorageStatus()
      });
      return;
    }

    if (req.method === "GET" && url.pathname.startsWith("/api/evidence/file/")) {
      if (!isAuthorizedDownload(req, url)) {
        sendJson(res, 401, { error: "unauthorized" });
        return;
      }
      const fileId = decodeURIComponent(url.pathname.replace("/api/evidence/file/", ""));
      const file = await readEvidenceFile(fileId);
      if (!file) {
        sendJson(res, 404, { error: "not_found" });
        return;
      }
      sendFile(res, file);
      return;
    }

    if (!isAuthorized(req)) {
      sendJson(res, 401, { error: "unauthorized" });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/state") {
      sendJson(res, 200, await readState());
      return;
    }

    if (req.method === "PUT" && url.pathname === "/api/state") {
      const payload = await readJson(req);
      await writeState(payload);
      sendJson(res, 200, payload);
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/findings") {
      const state = await readState();
      sendJson(res, 200, state.findings || []);
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/people") {
      const state = await readState();
      sendJson(res, 200, state.people || []);
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/emails") {
      const state = await readState();
      sendJson(res, 200, state.emails || []);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/emails/send") {
      const payload = await readJson(req);
      const result = await sendOutboundEmail(payload);
      sendJson(res, 200, result);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/evidence/file") {
      const payload = await readJson(req);
      const result = await saveEvidenceFile(payload);
      const tokenQuery = API_TOKEN ? `?token=${encodeURIComponent(API_TOKEN)}` : "";
      sendJson(res, 200, {
        ...result,
        url: `${externalBaseUrl(req)}/api/evidence/file/${encodeURIComponent(result.evidenceFileId)}${tokenQuery}`
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/jobs/reminders") {
      const state = await readState();
      const result = await runReminderJob(state);
      await writeState(result.state);
      lastReminderRun = { at: new Date().toISOString(), ok: true, created: result.created };
      sendJson(res, 200, { ok: true, created: result.created, state: result.state });
      return;
    }

    sendJson(res, 404, { error: "not_found" });
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: "server_error", message: error.message });
  }
});

server.listen(PORT, () => {
  console.log(`Reporte Desvios API escuchando en http://localhost:${PORT}`);
  console.log("Reportes directos activos. Los hallazgos se ingresan directo en la plataforma.");
  startAutoReminders();
});

function sendJson(res, status, payload) {
  send(res, status, JSON.stringify(payload));
}

function send(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": APP_ORIGIN,
    "Access-Control-Allow-Methods": "GET,PUT,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  });
  res.end(body);
}

function sendFile(res, file) {
  const name = encodeURIComponent(file.fileName || "evidencia");
  res.writeHead(200, {
    "Content-Type": file.mimeType || "application/octet-stream",
    "Content-Disposition": `inline; filename*=UTF-8''${name}`,
    "Access-Control-Allow-Origin": APP_ORIGIN,
    "Cache-Control": "private, max-age=3600"
  });
  res.end(file.buffer);
}

function isAuthorized(req) {
  if (!API_TOKEN) return true;
  const header = req.headers.authorization || "";
  return header === `Bearer ${API_TOKEN}`;
}

function isAuthorizedDownload(req, url) {
  if (!API_TOKEN) return true;
  if (url.searchParams.get("token") === API_TOKEN) return true;
  return isAuthorized(req);
}

function externalBaseUrl(req) {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${proto}://${host}`;
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

async function sendOutboundEmail(payload) {
  const to = String(payload.to || "").trim();
  const subject = String(payload.subject || "").trim();
  const body = String(payload.body || "").trim();
  if (!to || !subject || !body) {
    return { status: "failed", provider: "", errorMessage: "Faltan destinatario, asunto o detalle." };
  }

  try {
    const result = await sendMail({ to, subject, body });
    return {
      status: result.status,
      provider: result.provider,
      providerMessageId: result.providerMessageId || "",
      errorMessage: ""
    };
  } catch (error) {
    const errorMessage = describeError(error);
    console.error(`Correo fallido para ${to}: ${errorMessage}`);
    return {
      status: "failed",
      provider: getMailerStatus().provider,
      providerMessageId: "",
      errorMessage
    };
  }
}

function describeError(error) {
  if (!error) return "Error desconocido.";
  if (error.stack) return error.stack;
  if (error.message) return error.message;
  try {
    return JSON.stringify(error);
  } catch (_) {
    return String(error);
  }
}

function startAutoReminders() {
  if (!AUTO_REMINDER_MINUTES || AUTO_REMINDER_MINUTES < 1) {
    console.log("Recordatorios automaticos desactivados. Configura AUTO_REMINDER_MINUTES para activarlos.");
    return;
  }
  const intervalMs = AUTO_REMINDER_MINUTES * 60 * 1000;
  console.log(`Recordatorios automaticos activados cada ${AUTO_REMINDER_MINUTES} minutos.`);
  setInterval(runAutoReminders, intervalMs);
}

async function runAutoReminders() {
  try {
    const state = await readState();
    const result = await runReminderJob(state);
    await writeState(result.state);
    lastReminderRun = { at: new Date().toISOString(), ok: true, created: result.created };
    console.log(`Recordatorios automaticos OK: ${result.created} procesados.`);
  } catch (error) {
    lastReminderRun = { at: new Date().toISOString(), ok: false, error: error.message };
    console.error(`Recordatorios automaticos fallaron: ${error.message}`);
  }
}
