# Plataforma Web para Gestion de Hallazgos de Seguridad en Obra

Repositorio preparado para publicacion en GitHub Pages.

Esta carpeta contiene un MVP navegable de la web solicitada. Funciona como aplicacion estatica y guarda los datos en el almacenamiento local del navegador.

## Como abrir

Abre `index.html` en un navegador moderno. No requiere instalacion ni servidor para esta version.

## Como publicar

Revisa `PUBLICAR.md`. La opcion recomendada para trabajar con GitHub es subir esta carpeta a un repositorio y activar GitHub Pages desde la rama `main`.

## Incluye

- Roles de administrador y responsable.
- Formulario interno para reportar desde QR.
- Hallazgos con criticidad, prioridad, estado, responsable, vencimiento, comentarios, evidencias e historial.
- Reportes directos desde formulario interno o APK.
- Alertas de correo simuladas.
- Revision administrativa para cerrar hallazgos.
- Dashboard con filtros y graficos.
- Personas predefinidas.
- Estado no procesable con justificacion.
- Reportes de plazos, responsables pendientes y promedios de resolucion.

## Integraciones preparadas

Para una version productiva, reemplazar las partes simuladas por:

- Base de datos real, por ejemplo PostgreSQL.
- Evidencias internas guardadas por el backend.
- Gmail API, SendGrid o Amazon SES para enviar correos reales.
- Autenticacion corporativa con Google Workspace o Microsoft Entra ID.

La ruta productiva esta detallada en `PRODUCTIVO.md`, con esquema inicial de base de datos en `docs/`.

## Backend productivo inicial

El repo incluye un backend Node sin dependencias externas en `backend/`.

- `GET /api/state`: estado oficial compartido.
- `PUT /api/state`: guarda cambios de la web.
- `POST /api/evidence/file`: guarda imagenes o videos de evidencia en el backend.
- `GET /api/evidence/file/:id`: permite abrir evidencias guardadas.
- `POST /api/jobs/reminders`: genera recordatorios de vencidos o proximos a vencer.
- `API_TOKEN`: token opcional para proteger la API.
- `AUTO_REMINDER_MINUTES`: activa recordatorios automaticos.
- `DATABASE_URL`: si se configura, el backend guarda el estado en PostgreSQL; si no, usa `backend/data/state.json`.

Nota: `API_TOKEN` es una proteccion basica. Para uso productivo completo se requiere login real por usuario.

El despliegue del backend esta en `docs/DESPLEGAR_BACKEND.md`.
Incluye `render.yaml` para crear el servicio en Render con menos pasos.

## App Android

El proyecto Android para generar la APK esta en `android/`. Revisa `docs/APK_ANDROID.md`.

## Captura de reportes

Los reportes nuevos se capturan desde el formulario interno de la web o desde la APK de usuario. La base oficial es PostgreSQL mediante el backend.
