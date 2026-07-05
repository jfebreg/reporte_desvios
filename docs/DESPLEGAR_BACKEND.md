# Desplegar Backend Productivo

GitHub Pages publica solo el frontend. El backend debe vivir en un servicio aparte con Node.js.

## Opcion simple: Render

1. Entra a Render y crea un `Web Service`.
2. Conecta el repositorio `jfebreg/reporte_desvios`.
3. Configura:
   - Runtime: Node
   - Build command: dejar vacio
   - Start command: `node backend/server.js`
4. Variables de entorno:
   - `PORT`: Render lo define automaticamente.
   - `APP_ORIGIN`: `https://jfebreg.github.io`
   - `API_TOKEN`: valor largo y dificil de adivinar.
   - `AUTO_IMPORT_MINUTES`: `15` para importar automaticamente cada 15 minutos, o `0` para desactivar.
   - `AUTO_REMINDER_MINUTES`: `1440` para recordatorios diarios, o `0` para desactivar.
   - `DATABASE_URL`: conexion PostgreSQL.
   - `DATABASE_SSL`: `true` en servicios cloud usuales.
   - `SENDGRID_API_KEY`: opcional para correos reales.
   - `MAIL_FROM`: correo remitente autorizado.
   - `GOOGLE_SHEET_ID`
   - `GOOGLE_SHEET_RANGE`
   - `GOOGLE_CLIENT_EMAIL`
   - `GOOGLE_PRIVATE_KEY`
5. Recomendado: crea una base PostgreSQL y copia su `DATABASE_URL`.
6. Cuando Render entregue la URL, edita `config.js`:

```js
window.REPORTE_DESVIOS_CONFIG = {
  apiBaseUrl: "https://TU-BACKEND.onrender.com",
  apiToken: "MISMO_VALOR_DE_API_TOKEN"
};
```

7. Sube `config.js` a GitHub para que GitHub Pages use el backend.

## Opcion local para prueba

1. Copia `backend/.env.example` como `backend/.env`.
2. Completa las variables Google.
3. Ejecuta:

```bash
node backend/scripts/check-google.js
node backend/server.js
```

4. Edita `config.js`:

```js
window.REPORTE_DESVIOS_CONFIG = {
  apiBaseUrl: "http://localhost:8787",
  apiToken: "MISMO_VALOR_DE_API_TOKEN"
};
```

5. Abre la web local y usa `Importar automatico GSheet`.

## Endpoints utiles

```text
GET  /api/health
GET  /api/google-sheets/status
GET  /api/google-sheets/preview
GET  /api/state
PUT  /api/state
POST /api/import/google-sheets
POST /api/jobs/reminders
```

`GET /api/health` muestra si la importacion automatica esta activa y el resultado del ultimo intento.
Tambien muestra si el backend esta usando almacenamiento `json` o `postgres`.

## Pendiente para produccion robusta

Si no configuras `DATABASE_URL`, el backend guarda estado en `backend/data/state.json`. Para uso real con varios usuarios, configura PostgreSQL. Ver `docs/POSTGRES.md`.

## Nota de seguridad

`API_TOKEN` es una barrera basica para evitar llamadas accidentales o abiertas al backend. Como el frontend en GitHub Pages es publico, cualquier token puesto en `config.js` puede ser visto por usuarios con conocimientos tecnicos. Para produccion completa se debe implementar autenticacion real por usuario, por ejemplo Google Workspace o Microsoft Entra ID.
