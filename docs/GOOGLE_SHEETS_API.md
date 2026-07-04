# Conexion Backend con Google Sheets API

La web publicada en GitHub Pages sigue funcionando sin backend. Para usar datos compartidos y traer registros automaticamente desde Google Sheets, se debe ejecutar el backend incluido en `backend/`.

## 1. Crear credencial Google

1. En Google Cloud, crea o selecciona un proyecto.
2. Habilita Google Sheets API.
3. Crea una cuenta de servicio.
4. Descarga su JSON o copia:
   - `client_email`
   - `private_key`
5. Comparte la Google Sheet con el correo de la cuenta de servicio, con permiso de lector.

## 2. Configurar backend

Copia `backend/.env.example` como `backend/.env` y completa:

```env
PORT=8787
APP_ORIGIN=http://localhost:4181
GOOGLE_SHEET_ID=ID_DE_LA_SHEET
GOOGLE_SHEET_RANGE=Respuestas de formulario 1!A:Z
GOOGLE_CLIENT_EMAIL=cuenta-servicio@proyecto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Tambien puedes usar:

```env
GOOGLE_SERVICE_ACCOUNT_JSON=C:\ruta\service-account.json
```

## 3. Ejecutar backend

Desde la carpeta del repo:

```bash
node backend/scripts/check-google.js
node backend/server.js
```

API local:

```text
http://localhost:8787/api/health
```

## 4. Conectar frontend

Edita `config.js`:

```js
window.REPORTE_DESVIOS_CONFIG = {
  apiBaseUrl: "http://localhost:8787"
};
```

Luego abre la web local. En `Importar Sheets`, usa `Importar automatico GSheet`.

## 5. Publicacion real

Para uso real con varios usuarios:

- El backend debe estar publicado en un servidor o plataforma cloud.
- `config.js` debe apuntar a esa URL HTTPS.
- La base `backend/data/state.json` es una primera etapa; para produccion estable debe migrarse a PostgreSQL usando `docs/productivo-schema.sql`.
- No subir `backend/.env` ni archivos de service account a GitHub.

Ver tambien `docs/DESPLEGAR_BACKEND.md`.
