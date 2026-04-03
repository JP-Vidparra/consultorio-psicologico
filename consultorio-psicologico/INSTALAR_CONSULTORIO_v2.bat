@echo off
title Instalador - Sistema Consultorio
color 0A

echo.
echo  ================================================
echo   INSTALADOR - SISTEMA CONSULTORIO PSICOLOGICO
echo  ================================================
echo.
echo  Este proceso tarda aprox. 5-10 minutos.
echo  NO cierres esta ventana.
echo.
echo  Presiona cualquier tecla para comenzar...
pause >nul

:: ── Verificar internet ────────────────────────────────────────
echo.
echo  Verificando conexion a internet...
ping -n 1 nodejs.org >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  ════════════════════════════════════════════
    echo   SE NECESITA CONEXION A INTERNET
    echo  ════════════════════════════════════════════
    echo.
    echo  Conecta el computador a Wifi o a datos
    echo  moviles y vuelve a ejecutar este archivo.
    echo.
    pause
    exit /b 0
)

:: ── Node.js ───────────────────────────────────────────────────
echo.
echo  [1/5] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% == 0 (
    for /f "tokens=*" %%v in ('node --version') do echo  [OK] Node.js %%v ya estaba instalado.
) else (
    echo  [..] Descargando Node.js (puede tardar unos minutos)...
    powershell -Command "[Net.ServicePointManager]::SecurityProtocol = 'Tls12'; Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.18.0/node-v20.18.0-x64.msi' -OutFile '$env:TEMP\node_installer.msi'"
    if not exist "%TEMP%\node_installer.msi" (
        echo.
        echo  [ERROR] No se pudo descargar Node.js.
        echo  Revisa la conexion a internet y vuelve a intentar.
        pause & exit /b 1
    )
    msiexec /i "%TEMP%\node_installer.msi" /quiet /norestart
    del "%TEMP%\node_installer.msi" >nul 2>&1
    set "PATH=%PATH%;C:\Program Files\nodejs"
    node --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo.
        echo  [AVISO] Node.js se instalo pero necesita reiniciar.
        echo  Reinicia el computador y vuelve a ejecutar este archivo.
        pause & exit /b 1
    )
    echo  [OK] Node.js instalado correctamente.
)

:: ── Git ───────────────────────────────────────────────────────
echo.
echo  [2/5] Verificando Git...
git --version >nul 2>&1
if %errorlevel% == 0 (
    echo  [OK] Git ya estaba instalado.
) else (
    echo  [..] Descargando Git...
    powershell -Command "[Net.ServicePointManager]::SecurityProtocol = 'Tls12'; Invoke-WebRequest -Uri 'https://github.com/git-for-windows/git/releases/download/v2.47.0.windows.1/Git-2.47.0-64-bit.exe' -OutFile '$env:TEMP\git_installer.exe'"
    if not exist "%TEMP%\git_installer.exe" (
        echo  [ERROR] No se pudo descargar Git.
        pause & exit /b 1
    )
    "%TEMP%\git_installer.exe" /VERYSILENT /NORESTART
    del "%TEMP%\git_installer.exe" >nul 2>&1
    set "PATH=%PATH%;C:\Program Files\Git\cmd"
    echo  [OK] Git instalado.
)

set "DIR=%~dp0"

:: ── Backend ───────────────────────────────────────────────────
echo.
echo  [3/5] Instalando modulos del backend...
cd /d "%DIR%backend"
call npm install
if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] Fallo la instalacion del backend.
    echo  Captura una foto de esta pantalla y enviala a soporte.
    pause & exit /b 1
)
echo  [OK] Backend listo.

:: ── Frontend ──────────────────────────────────────────────────
echo.
echo  [4/5] Instalando modulos del frontend...
cd /d "%DIR%frontend"
call npm install
if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] Fallo la instalacion del frontend.
    echo  Captura una foto de esta pantalla y enviala a soporte.
    pause & exit /b 1
)
echo  [OK] Frontend listo.

:: ── Base de datos ─────────────────────────────────────────────
echo.
echo  [5/5] Configurando base de datos...
cd /d "%DIR%backend"
node src/db/setup.js
if %errorlevel% neq 0 (
    echo  [ERROR] Fallo la configuracion de la base de datos.
    echo  Captura una foto de esta pantalla y enviala a soporte.
    pause & exit /b 1
)
echo  [OK] Base de datos lista.

:: ── Accesos directos en Escritorio ───────────────────────────
echo.
echo  Creando accesos directos en el Escritorio...
set "DESKTOP=%USERPROFILE%\Desktop"

:: Acceso directo - Iniciar sistema
powershell -Command "$ws=New-Object -ComObject WScript.Shell; $s=$ws.CreateShortcut('%DESKTOP%\Iniciar Consultorio.lnk'); $s.TargetPath='%DIR%INICIAR_SISTEMA.bat'; $s.WorkingDirectory='%DIR%'; $s.IconLocation='C:\Windows\System32\shell32.dll,43'; $s.Save()" >nul 2>&1

:: Acceso directo - Actualizar sistema
powershell -Command "$ws=New-Object -ComObject WScript.Shell; $s=$ws.CreateShortcut('%DESKTOP%\Actualizar Consultorio.lnk'); $s.TargetPath='%DIR%ACTUALIZAR_SISTEMA.bat'; $s.WorkingDirectory='%DIR%'; $s.IconLocation='C:\Windows\System32\shell32.dll,46'; $s.Save()" >nul 2>&1

echo  [OK] Accesos directos creados.

:: ── Listo ─────────────────────────────────────────────────────
echo.
echo  ════════════════════════════════════════════════
echo   INSTALACION COMPLETA
echo  ════════════════════════════════════════════════
echo.
echo  DATOS DE ACCESO AL SISTEMA:
echo.
echo    Correo:     admin@consultorio.com
echo    Contrasena: Consultorio2024!
echo.
echo  En el Escritorio tienes dos iconos:
echo.
echo    "Iniciar Consultorio"    - Para usar el sistema
echo    "Actualizar Consultorio" - Para recibir mejoras
echo.
pause
