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

echo Generando APK release...
if exist "gradlew.bat" (
  call gradlew.bat assembleRelease
) else (
  echo.
  echo No existe gradlew.bat en este proyecto.
  echo Abrire Android Studio en la carpeta correcta.
  echo Luego usa: Build ^> Build App Bundle(s) / APK(s) ^> Build APK(s)
  echo.
  start "" "C:\Program Files\Android\Android Studio\bin\studio64.exe" "%CD%"
  pause
  exit /b 0
)
if errorlevel 1 (
  echo.
  echo No se pudo compilar con gradlew. Abre esta carpeta en Android Studio y usa Build APK.
  pause
  exit /b 1
)

if not exist "..\..\hallazgos-seguridad.apk" mkdir "..\.." >nul 2>nul
copy /Y "app\build\outputs\apk\release\app-release.apk" "..\..\hallazgos-seguridad.apk"
echo.
echo APK listo:
echo %CD%\..\..\hallazgos-seguridad.apk
pause
