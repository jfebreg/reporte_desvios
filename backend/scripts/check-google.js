const { loadEnv } = require("../src/env");
const { getGoogleSheetsStatus, previewGoogleSheets } = require("../src/sheets");

loadEnv();

(async () => {
  console.log("Estado configuracion Google Sheets:");
  console.log(JSON.stringify(getGoogleSheetsStatus(), null, 2));
  console.log("\nProbando lectura...");
  const preview = await previewGoogleSheets();
  console.log(JSON.stringify(preview, null, 2));
})().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
});
