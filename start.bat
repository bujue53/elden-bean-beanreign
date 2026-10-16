@echo off
chcp 65001 >nul
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 goto nonode

node server.js
goto end

:nonode
echo.
echo Node.js not found. Please install Node.js from https://nodejs.org and run this file again.
echo.
pause
exit /b 1

:end
pause
