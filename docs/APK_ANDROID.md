# APK Android

Proyecto Android listo en `android/`.

## Generar APK

Camino rapido:

1. Entra a la carpeta `android/`.
2. Para APK usuario ejecuta `generar-apk-usuario.bat`.
3. Para APK admin ejecuta `generar-apk-rapido.bat`.
4. Si Gradle ya esta sincronizado, dejara `hallazgos-usuario.apk` en la raiz del proyecto web.
5. Si falla por descarga o plugin, abre Android Studio, espera el Sync y vuelve a ejecutar el script.

Desde Android Studio:

1. Espera que sincronice Gradle.
2. Ve a `Build > Generate Signed App Bundle / APK`.
3. Elige `APK`.
4. Usa la firma local creada por `generar-apk-rapido.bat` o crea una nueva.
5. Genera variante `adminRelease` para administradores o `usuarioRelease` para responsables.

Para pruebas sin firma release:

1. Ve a `Build > Build App Bundle(s) / APK(s) > Build APK(s)`.
2. Android Studio dejara APKs por variante en `android/app/build/outputs/apk/`.

## Publicar APK usuario

Cuando exista `hallazgos-usuario.apk` en la raiz del proyecto web y se suba a GitHub Pages, el link de descarga sera:

`https://jfebreg.github.io/reporte_desvios/hallazgos-usuario.apk`

## Funcionamiento

- APK admin: abre `https://jfebreg.github.io/reporte_desvios/?v=remember-user-1`.
- APK usuario: abre `https://jfebreg.github.io/reporte_desvios/?app=usuario&v=remember-user-1`.
- El login es por correo y PIN.
- El formulario permite adjuntar imagen o video desde el telefono.
- Requiere internet para usar backend, correos y evidencias.
- La APK usuario muestra solo `Reportar`, `Hallazgos` asignados al usuario y `Salir`.

## Distribucion

Para pruebas internas puedes compartir el APK generado directamente.

Android igual pedira permitir instalacion desde origen desconocido si el APK no viene desde Play Store. Eso no se puede eliminar en distribucion directa. Lo que si reduce friccion es:

- Usar APK `release` firmado.
- Mantener permisos minimos.
- APK admin usa `applicationId`: `cl.iccingenieria.hallazgos`.
- APK usuario usa `applicationId`: `cl.iccingenieria.hallazgos.usuario`.
- Pasar a Google Play prueba interna cuando se quiera una instalacion mas limpia.
