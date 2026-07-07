# Correo real con Gmail

El backend puede enviar correos reales por Gmail SMTP usando una contrasena de aplicacion. No uses la clave normal de la cuenta.

## Variables en Render

En `reporte-desvios-api > Environment` configura:

```txt
GMAIL_USER=jfebre@iccingenieria.cl
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
MAIL_FROM=jfebre@iccingenieria.cl
SENDGRID_API_KEY=disabled
```

Luego ejecuta `Save, rebuild, and deploy`.

## Crear contrasena de aplicacion

1. Entra a tu Cuenta Google.
2. Activa `Verificacion en 2 pasos` si no esta activa.
3. Busca `Contrasenas de aplicaciones`.
4. Crea una para `Correo` o `Otra app`.
5. Copia la clave de 16 caracteres y pegala en Render como `GMAIL_APP_PASSWORD`. Si Google la muestra con espacios, puedes pegarla igual.

## Prueba

1. Abre la web.
2. Entra como administrador.
3. Abre `Alertas correo`.
4. Presiona `Enviar prueba usuarios`.
5. Revisa la columna `Estado`.

Estados esperados:

- `Enviado`: Gmail acepto el correo.
- `Simulado`: faltan variables Gmail en Render.
- `Fallido`: Gmail rechazo el envio; normalmente es clave incorrecta, cuenta sin contrasena de aplicacion o bloqueo de seguridad.
