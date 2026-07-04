# Plataforma Web para Gestion de Hallazgos de Seguridad en Obra

Repositorio preparado para publicacion en GitHub Pages.

Esta carpeta contiene un MVP navegable de la web solicitada. Funciona como aplicacion estatica y guarda los datos en el almacenamiento local del navegador.

## Como abrir

Abre `index.html` en un navegador moderno. No requiere instalacion ni servidor para esta version.

## Como publicar

Revisa `PUBLICAR.md`. La opcion recomendada para trabajar con GitHub es subir esta carpeta a un repositorio y activar GitHub Pages desde la rama `main`.

## Incluye

- Roles de administrador y responsable.
- Hallazgos con criticidad, prioridad, estado, responsable, vencimiento, comentarios, evidencias e historial.
- Importacion desde Google Sheets mediante CSV.
- Evita duplicados por `sheetRowId`.
- Alertas de correo simuladas.
- Revision administrativa para cerrar hallazgos.
- Dashboard con filtros y graficos.
- Personas predefinidas.
- Estado no procesable con justificacion.
- Reportes de plazos, responsables pendientes y promedios de resolucion.

## Integraciones preparadas

Para una version productiva, reemplazar las partes simuladas por:

- Google Sheets API para importar filas nuevas desde la hoja de respuestas.
- Base de datos real, por ejemplo PostgreSQL.
- Google Drive API para subir evidencias a carpetas administradas.
- Gmail API, SendGrid o Amazon SES para enviar correos reales.
- Autenticacion corporativa con Google Workspace o Microsoft Entra ID.

La ruta productiva esta detallada en `PRODUCTIVO.md`, con esquema inicial de base de datos y puente Apps Script en `docs/`.

## Backend productivo inicial

El repo incluye un backend Node sin dependencias externas en `backend/`.

- `GET /api/state`: estado oficial compartido.
- `PUT /api/state`: guarda cambios de la web.
- `POST /api/import/google-sheets`: importa respuestas nuevas con Google Sheets API.

La configuracion de Google Sheets API esta en `docs/GOOGLE_SHEETS_API.md`.
El despliegue del backend esta en `docs/DESPLEGAR_BACKEND.md`.

## Formato CSV de importacion

```csv
sheetRowId,fecha,obra,ubicacion,descripcion,foto
FORM-1006,2026-07-03,Edificio Norte,Piso 12,Linea de vida sin certificacion visible,https://drive.google.com/foto1
```
