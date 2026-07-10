# Desplegar Backend Productivo

GitHub Pages publica solo el frontend. El backend debe vivir en un servicio aparte con Node.js.

## Opcion simple: Render

1. Entra a Render y crea un `Blueprint`, o crea manualmente un `Web Service`.
2. Conecta el repositorio `jfebreg/reporte_desvios`.
3. Si usas Blueprint, Render leera `render.yaml`.
4. Si lo haces manual, configura:
   - Runtime: Node
   - Build command: `npm install`
   - Start command: `npm start`
5. Variables de entorno:
   - `PORT`: Render lo define automaticamente.
   - `APP_ORIGIN`: `https://jfebreg.github.io`
   - `API_TOKEN`: valor largo y dificil de adivinar.
   - `AUTO_REMINDER_MINUTES`: `1440` para recordatorios diarios, o `0` para desactivar.
   - `DATABASE_URL`: conexion PostgreSQL.
   - `DATABASE_SSL`: `true` en servicios cloud usuales.
   - `SENDGRID_API_KEY`: opcional para correos reales.
   - `MAIL_FROM`: correo remitente autorizado.
6. Recomendado: crea una base PostgreSQL y copia su `DATABASE_URL`.
7. Cuando Render entregue la URL, edita `config.js`:

```js
window.REPORTE_DESVIOS_CONFIG = {
  apiBaseUrl: "https://TU-BACKEND.onrender.com",
  apiToken: "MISMO_VALOR_DE_API_TOKEN"
};
```

8. Sube `config.js` a GitHub para que GitHub Pages use el backend.

El repositorio incluye `render.yaml` para partir mas rapido. Debes completar las variables secretas de correo en el panel de Render.

## Opcion local para prueba

1. Copia `backend/.env.example` como `backend/.env`.
2. Completa `DATABASE_URL`, `API_TOKEN` y correo si corresponde.
3. Ejecuta:

```bash
node backend/server.js
```

4. Edita `config.js`:

```js
window.REPORTE_DESVIOS_CONFIG = {
  apiBaseUrl: "http://localhost:8787",
  apiToken: "MISMO_VALOR_DE_API_TOKEN"
};
```

5. Abre la web local y prueba crear un hallazgo.

## Endpoints utiles

```text
GET  /api/health
GET  /api/state
PUT  /api/state
POST /api/jobs/reminders
```

`GET /api/health` muestra si el backend esta usando almacenamiento `json` o `postgres`, y si los recordatorios automaticos estan activos.

## Pendiente para produccion robusta

Si no configuras `DATABASE_URL`, el backend guarda estado en `backend/data/state.json`. Para uso real con varios usuarios, configura PostgreSQL. Ver `docs/POSTGRES.md`.

## Nota de seguridad

`API_TOKEN` es una barrera basica para evitar llamadas accidentales o abiertas al backend. Como el frontend en GitHub Pages es publico, cualquier token puesto en `config.js` puede ser visto por usuarios con conocimientos tecnicos. Para produccion completa se debe implementar autenticacion real por usuario, por ejemplo Google Workspace o Microsoft Entra ID.
