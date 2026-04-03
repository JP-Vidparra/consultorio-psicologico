@echo off
title Actualizador - Sistema Consultorio
color 0B

echo.
echo  ================================================
echo   ACTUALIZAR SISTEMA CONSULTORIO
echo  ================================================
echo.
echo  Este proceso descarga los ultimos cambios
echo  del equipo de soporte tecnico.
echo.
echo  TUS DATOS NO SE BORRAN. Solo se actualiza el programa.
echo.
echo  Presiona cualquier tecla para continuar...
pause >nul

:: ── Verificar internet ────────────────────────────────────────
echo.
echo  Verificando conexion a internet...
ping -n 1 github.com >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  ════════════════════════════════════════════
    echo   SIN CONEXION A INTERNET
    echo  ════════════════════════════════════════════
    echo.
    echo  No hay conexion a internet en este momento.
    echo.
    echo  Opciones:
    echo    1. Conectate a Wifi o a datos moviles
    echo    2. Vuelve a ejecutar este archivo
    echo.
    echo  El sistema actual sigue funcionando con normalidad.
    echo.
    pause
    exit /b 0
)
echo  [OK] Conexion disponible.

:: ── Verificar Git ────────────────────────────────────────────
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  [..] Instalando Git (solo la primera vez)...
    powershell -Command "[Net.ServicePointManager]::SecurityProtocol = 'Tls12'; Invoke-WebRequest -Uri 'https://github.com/git-for-windows/git/releases/download/v2.47.0.windows.1/Git-2.47.0-64-bit.exe' -OutFile '$env:TEMP\git_installer.exe'"
    if not exist "%TEMP%\git_installer.exe" (
        echo.
        echo  [ERROR] No se pudo descargar Git.
        echo  Comunicate con soporte tecnico.
        pause
        exit /b 1
    )
    "%TEMP%\git_installer.exe" /VERYSILENT /NORESTART
    del "%TEMP%\git_installer.exe" >nul 2>&1
    set "PATH=%PATH%;C:\Program Files\Git\cmd"
    echo  [OK] Git instalado.
)

set "DIR=%~dp0"
cd /d "%DIR%"

:: ── Descargar cambios ─────────────────────────────────────────
echo.
echo  [1/3] Descargando cambios...
git pull origin main 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  ════════════════════════════════════════════
    echo   NO SE PUDO ACTUALIZAR
    echo  ════════════════════════════════════════════
    echo.
    echo  Posibles causas:
    echo    - La conexion se cayo durante la descarga
    echo    - Hay un problema con el servidor
    echo.
    echo  El sistema actual sigue funcionando.
    echo  Intenta de nuevo mas tarde o llama a soporte.
    echo.
    pause
    exit /b 1
)
echo  [OK] Cambios descargados.

:: ── Actualizar backend ────────────────────────────────────────
echo.
echo  [2/3] Actualizando backend...
cd /d "%DIR%backend"
call npm install --silent 2>nul
echo  [OK] Backend listo.

:: ── Actualizar frontend ───────────────────────────────────────
echo.
echo  [3/3] Actualizando frontend...
cd /d "%DIR%frontend"
call npm install --silent 2>nul
echo  [OK] Frontend listo.

:: ── Crear/actualizar acceso directo ───────────────────────────
set "DESKTOP=%USERPROFILE%\Desktop"
powershell -Command "$ws=New-Object -ComObject WScript.Shell; $s=$ws.CreateShortcut('%DESKTOP%\Iniciar Consultorio.lnk'); $s.TargetPath='%DIR%INICIAR_SISTEMA.bat'; $s.WorkingDirectory='%DIR%'; $s.IconLocation='C:\Windows\System32\shell32.dll,43'; $s.Save()" >nul 2>&1

echo.
echo  ════════════════════════════════════════════
echo   ACTUALIZACION COMPLETA
echo  ════════════════════════════════════════════
echo.
echo  El sistema ya tiene los ultimos cambios.
echo.
echo  Haz doble clic en "Iniciar Consultorio"
echo  en el Escritorio para arrancar el sistema.
echo.
pause
