@echo off
setlocal
cd /d "%~dp0"

set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
set PATH=%JAVA_HOME%\bin;%PATH%

if not exist "keystore.properties" (
  echo Creando firma local release...
  "%JAVA_HOME%\bin\keytool.exe" -genkeypair -v -keystore hallazgos-release.jks -storepass hallazgos2026 -keypass hallazgos2026 -alias hallazgos -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Hallazgos Seguridad, OU=ICC, O=ICC Ingenieria, L=Santiago, ST=RM, C=CL"
  (
    echo storeFile=hallazgos-release.jks
    echo storePassword=hallazgos2026
    echo keyAlias=hallazgos
    echo keyPassword=hallazgos2026
  ) > keystore.properties
)

echo Generando APK usuario release...
if exist "gradlew.bat" (
  call gradlew.bat :app:assembleUsuarioRelease
) else (
  echo.
  echo No existe gradlew.bat en este proyecto.
  echo Abre Android Studio en esta carpeta y genera la variante usuarioRelease.
  start "" "C:\Program Files\Android\Android Studio\bin\studio64.exe" "%CD%"
  pause
  exit /b 0
)

if errorlevel 1 (
  echo.
  echo No se pudo compilar con gradlew.
  echo Abre Android Studio, espera Sync completo y genera usuarioRelease.
  pause
  exit /b 1
)

if not exist "app\build\outputs\apk\usuario\release\app-usuario-release.apk" (
  echo.
  echo No se encontro el APK esperado:
  echo app\build\outputs\apk\usuario\release\app-usuario-release.apk
  pause
  exit /b 1
)

copy /Y "app\build\outputs\apk\usuario\release\app-usuario-release.apk" "..\hallazgos-usuario.apk"
echo.
echo APK usuario listo para publicar:
echo %CD%\..\hallazgos-usuario.apk
pause
