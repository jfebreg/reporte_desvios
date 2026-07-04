/**
 * Puente inicial Google Apps Script para exponer respuestas nuevas de Google Sheets.
 * Usar solo con una clave compartida fuerte y HTTPS.
 */

const API_KEY = 'CAMBIAR_POR_CLAVE_LARGA';
const SHEET_NAME = 'Respuestas de formulario 1';

function doGet(e) {
  const key = e.parameter.key;
  if (key !== API_KEY) {
    return jsonResponse({ error: 'unauthorized' }, 401);
  }

  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
  if (!sheet) {
    return jsonResponse({ error: 'sheet_not_found' }, 404);
  }

  const values = sheet.getDataRange().getValues();
  const header = values.shift();
  const rows = values.map((row, index) => {
    const record = { source_row_id: String(index + 2) };
    header.forEach((name, col) => {
      record[String(name).trim()] = row[col];
    });
    return record;
  });

  return jsonResponse({ rows });
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
