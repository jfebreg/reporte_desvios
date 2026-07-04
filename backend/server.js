const http = require("node:http");
const { URL } = require("node:url");
const { readState, writeState } = require("./src/store");
const { importFromGoogleSheets, getGoogleSheetsStatus, previewGoogleSheets } = require("./src/sheets");
const { loadEnv } = require("./src/env");

loadEnv();

const PORT = Number(process.env.PORT || 8787);
const APP_ORIGIN = process.env.APP_ORIGIN || "*";
const API_TOKEN = process.env.API_TOKEN || "";

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "OPTIONS") {
    send(res, 204, "");
    return;
  }

  try {
    if (!isAuthorized(req)) {
      sendJson(res, 401, { error: "unauthorized" });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/health") {
      sendJson(res, 200, { ok: true, service: "reporte-desvios-api", auth: API_TOKEN ? "enabled" : "disabled" });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/google-sheets/status") {
      sendJson(res, 200, getGoogleSheetsStatus());
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/google-sheets/preview") {
      sendJson(res, 200, await previewGoogleSheets());
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

    if (req.method === "POST" && url.pathname === "/api/import/google-sheets") {
      const state = await readState();
      const nextState = await importFromGoogleSheets(state);
      await writeState(nextState);
      sendJson(res, 200, nextState);
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

function isAuthorized(req) {
  if (!API_TOKEN) return true;
  const header = req.headers.authorization || "";
  return header === `Bearer ${API_TOKEN}`;
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}
