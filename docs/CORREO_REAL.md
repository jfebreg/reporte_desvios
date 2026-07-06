# Correo real con SendGrid

El backend puede enviar correos reales desde Render usando SendGrid. Si `SENDGRID_API_KEY` esta vacio o vale `disabled`, la app mantiene los correos como simulados.

## Variables en Render

En `reporte-desvios-api > Environment` configura:

```txt
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxx
MAIL_FROM=correo-verificado@tu-dominio.cl
```

Luego ejecuta `Manual Deploy > Deploy latest commit`.

## Requisitos SendGrid

- El remitente de `MAIL_FROM` debe estar verificado en SendGrid.
- La API key debe tener permiso para enviar correo.
- Si usas un dominio corporativo, conviene verificar el dominio completo en vez de solo un correo.

## Prueba

1. En la web asigna o reasigna un hallazgo.
2. Abre `Alertas correo`.
3. Revisa la columna `Estado`.

Estados posibles:

- `Enviado`: SendGrid acepto el correo.
- `Simulado`: SendGrid no esta configurado.
- `Pendiente`: el frontend aun espera respuesta del backend.
- `Fallido`: hubo error de SendGrid o del backend.
