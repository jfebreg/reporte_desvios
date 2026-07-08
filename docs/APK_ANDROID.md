# APK Android

Proyecto Android listo en `android/`.

## Generar APK

Camino rapido:

1. Entra a la carpeta `android/`.
2. Ejecuta `generar-apk-rapido.bat`.
3. Si existe Gradle wrapper, dejara el APK en `outputs/hallazgos-seguridad.apk`.
4. Si no existe wrapper, abrira Android Studio en el proyecto correcto.

Desde Android Studio:

1. Espera que sincronice Gradle.
2. Ve a `Build > Generate Signed App Bundle / APK`.
3. Elige `APK`.
4. Usa la firma local creada por `generar-apk-rapido.bat` o crea una nueva.
5. Genera variante `release`.

Para pruebas sin firma release:

1. Ve a `Build > Build App Bundle(s) / APK(s) > Build APK(s)`.
2. Android Studio dejara el APK en `android/app/build/outputs/apk/debug/app-debug.apk`.

## Funcionamiento

- La app abre `https://jfebreg.github.io/reporte_desvios/?v=perfiles-apk-1`.
- El login es por correo y PIN.
- El formulario permite adjuntar imagen o video desde el telefono.
- Requiere internet para usar backend, correos y evidencias.

## Distribucion

Para pruebas internas puedes compartir el APK generado directamente.

Android igual pedira permitir instalacion desde origen desconocido si el APK no viene desde Play Store. Eso no se puede eliminar en distribucion directa. Lo que si reduce friccion es:

- Usar APK `release` firmado.
- Mantener permisos minimos.
- Distribuir siempre el mismo `applicationId`: `cl.iccingenieria.hallazgos`.
- Pasar a Google Play prueba interna cuando se quiera una instalacion mas limpia.
