@echo off
title Bang AI — Basic Templates Engine Launcher
color 0A
cls
echo ========================================================
echo         BANG AI - BASIC & STOCK TEMPLATES LAUNCHER
echo ========================================================
echo.
echo Select the engine you want to start:
echo.
echo   [1] Start MoneyPrinterTurbo (Stock Video Generator - Port 8501)
echo   [2] Start AgentTube (YouTube Channel Automation - Port 3456)
echo   [3] Start Both Engines
echo   [4] Open Bang AI Basic Templates in Browser
echo.
set /p choice="Enter choice [1-4] (Default is 1): "
if "%choice%"=="" set choice=1

if "%choice%"=="1" goto start_mpt
if "%choice%"=="2" goto start_agenttube
if "%choice%"=="3" goto start_both
if "%choice%"=="4" goto open_browser

:start_mpt
echo.
echo [INFO] Starting MoneyPrinterTurbo on http://localhost:8501...
cd /d "%~dp0MoneyPrinterTurbo"
call webui.bat
goto end

:start_agenttube
echo.
echo [INFO] Starting AgentTube on http://localhost:3456...
cd /d "%~dp0youtube-automation-agent"
npm start
goto end

:start_both
echo.
echo [INFO] Starting both engines in background windows...
start "MoneyPrinterTurbo" cmd /k "cd /d %~dp0MoneyPrinterTurbo && call webui.bat"
start "AgentTube" cmd /k "cd /d %~dp0youtube-automation-agent && npm start"
echo [INFO] Both engines launched. Returning to Bang AI...
timeout /t 3 /nobreak >nul
goto open_browser

:open_browser
start http://localhost:5173/#/basic-templates
echo.
echo [OK] Opened Bang AI Basic Templates page in your browser.
goto end

:end
pause
