# Correo real con Resend

Resend es el camino recomendado para el piloto porque envia por API HTTP, no por SMTP. Esto evita los timeouts de Render contra Gmail SMTP.

## Variables en Render

En `reporte-desvios-api > Environment` configura:

```txt
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxx
MAIL_FROM=Hallazgos Seguridad <correo-verificado@tu-dominio.cl>
SENDGRID_API_KEY=disabled
```

Si `RESEND_API_KEY` esta configurado, el backend usa Resend antes que Gmail o SendGrid.

## Pasos en Resend

1. Crea cuenta en Resend.
2. Crea una API key.
3. Verifica un dominio o remitente permitido.
4. Copia la API key en Render como `RESEND_API_KEY`.
5. Usa como `MAIL_FROM` un correo autorizado por Resend.
6. Ejecuta `Save, rebuild, and deploy` en Render.

## Prueba

1. Abre la web.
2. Entra como administrador.
3. Abre `Alertas correo`.
4. Presiona `Enviar prueba usuarios`.
5. El proveedor debe aparecer como `resend` y el estado como `Enviado`.
