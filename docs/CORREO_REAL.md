# Correo real con SendGrid

SendGrid queda disponible como opcion productiva alternativa. Para el piloto actual se recomienda Gmail, documentado en `docs/CORREO_GMAIL.md`.

El backend puede enviar correos reales desde Render usando SendGrid. Si Gmail no esta configurado y `SENDGRID_API_KEY` esta vacio o vale `disabled`, la app mantiene los correos como simulados.

## Variables en Render

En `reporte-desvios-api > Environment` configura:

```txt
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxx
MAIL_FROM=jfebre@iccingenieria.cl
```

Luego ejecuta `Manual Deploy > Deploy latest commit`.

## Requisitos SendGrid

- El remitente de `MAIL_FROM` debe estar verificado en SendGrid.
- La API key debe tener permiso para enviar correo.
- Si usas un dominio corporativo, conviene verificar el dominio completo en vez de solo un correo.

## Prueba

1. Abre `Alertas correo`.
2. Presiona `Enviar prueba usuarios`.
3. Revisa la columna `Estado`.
4. Si la prueba sale bien, asigna o reasigna un hallazgo para validar el correo operativo.

Estados posibles:

- `Enviado`: SendGrid acepto el correo.
- `Simulado`: SendGrid no esta configurado.
- `Pendiente`: el frontend aun espera respuesta del backend.
- `Fallido`: hubo error de SendGrid o del backend.
