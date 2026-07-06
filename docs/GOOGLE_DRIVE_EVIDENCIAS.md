# Evidencias en Google Drive

La web puede subir archivos de evidencia a una carpeta de Google Drive usando el backend en Render.

## Preparar carpeta

1. Crea una carpeta en Google Drive, por ejemplo `Evidencias hallazgos seguridad`.
2. Comparte la carpeta con el correo de la cuenta de servicio:

```txt
GOOGLE_CLIENT_EMAIL
```

3. Dale permiso `Editor`.
4. Copia el ID de la carpeta desde la URL.

Ejemplo:

```txt
https://drive.google.com/drive/folders/1ABCDEF123456789
```

El ID es:

```txt
1ABCDEF123456789
```

## Variable en Render

En `reporte-desvios-api > Environment` agrega:

```txt
GOOGLE_DRIVE_EVIDENCE_FOLDER_ID=1ABCDEF123456789
```

Luego ejecuta `Manual Deploy > Deploy latest commit`.

## API requerida

En Google Cloud habilita `Google Drive API` en el mismo proyecto donde habilitaste Google Sheets API.

## Uso

En un hallazgo, en `Evidencias`, el usuario puede elegir un archivo. La web lo envia a Render, Render lo sube a Drive y devuelve el enlace asociado al hallazgo.
