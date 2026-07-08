# APK Android

Proyecto Android listo en `android/`.

## Generar APK

1. Abre Android Studio.
2. Selecciona `File > Open`.
3. Abre la carpeta `android`.
4. Espera que sincronice Gradle.
5. Ve a `Build > Build App Bundle(s) / APK(s) > Build APK(s)`.
6. Android Studio dejara el APK en `android/app/build/outputs/apk/debug/app-debug.apk`.

## Funcionamiento

- La app abre `https://jfebreg.github.io/reporte_desvios/?v=perfiles-apk-1`.
- El login es por correo y PIN.
- El formulario permite adjuntar imagen o video desde el telefono.
- Requiere internet para usar backend, correos y evidencias.

## Distribucion

Para pruebas internas puedes compartir el APK generado directamente. Android pedira permitir instalacion desde origen desconocido.
