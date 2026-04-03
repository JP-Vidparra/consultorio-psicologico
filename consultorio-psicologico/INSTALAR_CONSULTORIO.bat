@echo off
title Instalador - Sistema Consultorio
color 0A

echo.
echo  ================================================
echo  INSTALADOR - SISTEMA CONSULTORIO PSICOLOGICO
echo  ================================================
echo.
echo  Este proceso tarda aprox. 5-10 minutos.
echo  NO cierres esta ventana.
echo.
pause

echo.
echo  [1/4] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% == 0 (
    for /f "tokens=*" %%v in ('node --version') do echo  [OK] Node.js %%v encontrado.
) else (
    echo  [..] Descargando Node.js LTS...
    powershell -Command "[Net.ServicePointManager]::SecurityProtocol = 'Tls12'; Invoke-WebRequest -Uri 'https://nodejs.org/dist/v24.14.0/node-v24.14.0-x64.msi' -OutFile '$env:TEMP\node_installer.msi'"
    if not exist "%TEMP%\node_installer.msi" (
        echo  [ERROR] No se pudo descargar Node.js.
        pause & exit /b 1
    )
    msiexec /i "%TEMP%\node_installer.msi" /quiet /norestart
    del "%TEMP%\node_installer.msi" >nul 2>&1
    set "PATH=%PATH%;C:\Program Files\nodejs"
    node --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo  [AVISO] Reinicia el computador y vuelve a ejecutar.
        pause & exit /b 1
    )
    echo  [OK] Node.js instalado.
)

echo.
echo  [2/4] Instalando dependencias del backend...
set "DIR=%~dp0"
cd /d "%DIR%backend"
call npm install
if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] Fallo la instalacion del backend.
    echo  Revisa los mensajes de error arriba y comparte una captura.
    pause
    exit /b 1
)
echo  [OK] Backend listo.

echo.
echo  [3/4] Instalando dependencias del frontend...
cd /d "%DIR%frontend"
call npm install
if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] Fallo la instalacion del frontend.
    pause
    exit /b 1
)
echo  [OK] Frontend listo.

echo.
echo  [4/4] Configurando base de datos...
cd /d "%DIR%backend"
node src/db/setup.js
if %errorlevel% neq 0 (
    echo  [ERROR] Fallo la configuracion de la base de datos.
    pause
    exit /b 1
)

echo.
echo  Creando acceso directo en el Escritorio...
set "DESKTOP=%USERPROFILE%\Desktop"
powershell -Command "$ws=New-Object -ComObject WScript.Shell; $s=$ws.CreateShortcut('%DESKTOP%\Iniciar Consultorio.lnk'); $s.TargetPath='%DIR%INICIAR_SISTEMA.bat'; $s.WorkingDirectory='%DIR%'; $s.IconLocation='C:\Windows\System32\shell32.dll,43'; $s.Save()" >nul 2>&1

echo.
echo  ================================================
echo  INSTALACION COMPLETA
echo  ================================================
echo.
echo  DATOS DE ACCESO:
echo    Email:      admin@consultorio.com
echo    Contrasena: Consultorio2024!
echo.
echo  Doble clic en "Iniciar Consultorio" del Escritorio.
echo.
pause
