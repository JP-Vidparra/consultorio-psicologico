@echo off
title Sistema Consultorio
color 0A

echo.
echo  Iniciando Sistema Consultorio...
echo  NO cierres esta ventana mientras trabajas.
echo.

set "DIR=%~dp0"

echo  [1/2] Iniciando backend...
start "Consultorio-Backend" /min cmd /c "cd /d "%DIR%backend" && npm start"

timeout /t 4 /nobreak >nul

echo  [2/2] Iniciando frontend...
start "Consultorio-Frontend" /min cmd /c "cd /d "%DIR%frontend" && npm start"

timeout /t 8 /nobreak >nul

echo  [OK] Abriendo navegador...
start http://localhost:3000

echo.
echo  Sistema listo. Minimiza esta ventana pero NO la cierres.
echo  Para apagar el sistema al final del dia: cierra esta ventana.
echo.
pause
