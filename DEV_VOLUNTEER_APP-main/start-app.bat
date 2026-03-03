@echo off
echo ========================================
echo Starting VolunAI Application
echo ========================================
echo.

echo [1/2] Starting Backend Server (Flask on port 5000)...
start "VolunAI Backend" cmd /k "cd volunai-backend && python app.py"
timeout /t 3 /nobreak > nul

echo [2/2] Starting Frontend Server (Vite on port 5173)...
start "VolunAI Frontend" cmd /k "cd volunai-frontend && npm run dev"

echo.
echo ========================================
echo VolunAI is starting up!
echo ========================================
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo ========================================
echo.
echo Press any key to exit this window...
pause > nul
