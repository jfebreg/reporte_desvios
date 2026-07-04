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
   - `GOOGLE_SHEET_ID`
   - `GOOGLE_SHEET_RANGE`
   - `GOOGLE_CLIENT_EMAIL`
   - `GOOGLE_PRIVATE_KEY`
5. Cuando Render entregue la URL, edita `config.js`:

```js
window.REPORTE_DESVIOS_CONFIG = {
  apiBaseUrl: "https://TU-BACKEND.onrender.com"
};
```

6. Sube `config.js` a GitHub para que GitHub Pages use el backend.

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
  apiBaseUrl: "http://localhost:8787"
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
```

## Pendiente para produccion robusta

La version actual guarda estado en `backend/data/state.json`. Esto sirve para una primera prueba real, pero para produccion estable debe reemplazarse por PostgreSQL usando `docs/productivo-schema.sql`.
