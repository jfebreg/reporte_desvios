# Opcion Productiva Real

Este documento define el paso desde el MVP publicado en GitHub Pages hacia una plataforma multiusuario real.

## Objetivo

Convertir la demo estatica en un sistema con datos compartidos, usuarios reales, auditoria, formulario interno desde QR, evidencias administradas por el backend y correos reales.

## Arquitectura Recomendada

1. Frontend web
   - Mantener la interfaz actual como base.
   - Reemplazar `localStorage` por llamadas a una API.
   - Publicar en Vercel, Netlify o hosting corporativo.

2. Backend API
   - Node.js con Express/Fastify o Python con FastAPI.
   - Endpoints para hallazgos, personas, obras, evidencias, estados, dashboard y alertas.
   - Control de permisos por rol.

3. Base de datos
   - PostgreSQL recomendado.
   - Fuente oficial del sistema.
   - Google Sheets queda como bandeja de entrada.

4. Autenticacion
   - Google Workspace o Microsoft Entra ID.
   - Roles internos: administrador y responsable.

5. Integraciones externas
   - Google Sheets API solo para importar datos historicos o de respaldo.
   - Backend/PostgreSQL para evidencias internas.
   - Gmail API, SendGrid o Amazon SES para correos.

6. Tareas automaticas
   - Importar nuevos registros desde Sheets cada 5-15 minutos.
   - Generar recordatorios antes del vencimiento.
   - Marcar vencidos.
   - Reintentar correos fallidos.

## Flujo Productivo

1. QR abre el formulario interno de la web.
2. El backend registra el hallazgo y adjuntos en la base oficial.
3. Google Sheets queda solo como respaldo o importacion historica.
4. Administrador clasifica y asigna responsable.
5. Backend envia correo real.
6. Responsable entra con su cuenta, gestiona y sube evidencia.
7. Evidencia se guarda en el backend y se vincula al hallazgo.
8. Administrador aprueba cierre u observa.
9. Dashboard consulta la base de datos y no el navegador local.

## Prioridad de Implementacion

### Fase 1: Base productiva minima

- Backend API.
- PostgreSQL.
- Login.
- CRUD de hallazgos y personas.
- Formulario interno desde QR.
- Importacion automatica desde Google Sheet solo como respaldo.
- Dashboard con datos reales.

### Fase 2: Gestion operacional

- Evidencias internas con descarga desde backend.
- Correos reales.
- Recordatorios programados.
- Historial/auditoria completo.
- Exportaciones.

### Fase 3: Gobierno y escalamiento

- Multiobra.
- Permisos por obra.
- Reportes periodicos.
- Panel ejecutivo.
- Backups y monitoreo.

## Datos Necesarios Para Implementar

- URL o ID de Google Sheet.
- Nombre exacto de la pestana de respuestas.
- Encabezados actuales del formulario.
- Cuenta Google/Workspace solo si se mantendra importacion desde Sheets.
- Dominio/correos autorizados.
- Lista inicial de usuarios y roles.
- Definicion de obras.
- Plazos y reglas de vencimiento oficiales.

## Recomendacion Practica

Para partir rapido sin exponer credenciales en el frontend, usar Apps Script como puente privado entre Google Sheets y el backend. Luego, en una segunda vuelta, migrar a Google Sheets API con cuenta de servicio si la organizacion lo permite.

## Implementacion incluida en este repo

Se agrego un backend inicial en `backend/` que:

- Expone API para estado compartido.
- Guarda datos en `backend/data/state.json` como primera etapa.
- Importa desde Google Sheets API usando cuenta de servicio.
- Permite que la web use backend al configurar `config.js`.

Para produccion estable, el siguiente cambio recomendado es reemplazar `backend/data/state.json` por PostgreSQL usando `docs/productivo-schema.sql`.
