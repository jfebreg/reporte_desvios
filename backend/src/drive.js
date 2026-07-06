const { getAccessToken } = require("./googleAuth");

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";

function getDriveStatus() {
  return {
    configured: Boolean(process.env.GOOGLE_DRIVE_EVIDENCE_FOLDER_ID),
    folderId: mask(process.env.GOOGLE_DRIVE_EVIDENCE_FOLDER_ID)
  };
}

async function uploadEvidenceFile({ fileName, mimeType, base64, findingId }) {
  if (!process.env.GOOGLE_DRIVE_EVIDENCE_FOLDER_ID) {
    throw new Error("Falta GOOGLE_DRIVE_EVIDENCE_FOLDER_ID en Render.");
  }
  if (!fileName || !base64) {
    throw new Error("Faltan nombre o contenido del archivo.");
  }

  const token = await getAccessToken(DRIVE_SCOPE);
  const safeName = `${findingId || "hallazgo"}-${Date.now()}-${fileName}`.replace(/[\\/:*?"<>|]+/g, "-");
  const metadata = {
    name: safeName,
    parents: [process.env.GOOGLE_DRIVE_EVIDENCE_FOLDER_ID]
  };
  const boundary = `reporte-desvios-${Date.now()}`;
  const fileBuffer = Buffer.from(base64, "base64");
  const delimiter = Buffer.from(`--${boundary}\r\n`);
  const closeDelimiter = Buffer.from(`\r\n--${boundary}--`);
  const metadataPart = Buffer.from(
    `Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`
  );
  const fileHeader = Buffer.from(`--${boundary}\r\nContent-Type: ${mimeType || "application/octet-stream"}\r\n\r\n`);
  const body = Buffer.concat([delimiter, metadataPart, fileHeader, fileBuffer, closeDelimiter]);

  const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
      "Content-Length": String(body.length)
    },
    body
  });

  if (!response.ok) {
    throw new Error(`Google Drive API fallo ${response.status}: ${await response.text()}`);
  }

  const payload = await response.json();
  return {
    driveFileId: payload.id || "",
    name: payload.name || safeName,
    url: payload.webViewLink || payload.webContentLink || "",
    provider: "google-drive"
  };
}

function mask(value) {
  const text = String(value || "");
  if (!text) return "";
  if (text.length <= 10) return "***";
  return `${text.slice(0, 4)}...${text.slice(-4)}`;
}

module.exports = { getDriveStatus, uploadEvidenceFile };
