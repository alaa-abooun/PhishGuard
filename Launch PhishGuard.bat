@echo off
title PhishGuard AI Launcher
echo.
echo  =============================================
echo   PhishGuard AI - Starting servers...
echo  =============================================
echo.

echo  [1/2] Starting Backend (Flask)...
start "PhishGuard Backend" cmd /k "cd /d %~dp0backend && venv\Scripts\python.exe run.py"

echo  Waiting for backend to start...
timeout /t 4 /nobreak >nul

echo  [2/2] Starting Frontend (React)...
start "PhishGuard Frontend" cmd /k "cd /d %~dp0frontend && npm start"

echo.
echo  Both servers are starting!
echo  Frontend will open at: http://localhost:3000
echo  Backend running at:    http://localhost:5000
echo.
echo  Close the two CMD windows to stop the servers.
pause
