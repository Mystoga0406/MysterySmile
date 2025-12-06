@echo off
chcp 65001 >nul

echo ======================================
echo Starting Mystery Smile (DEV MODE)
echo ======================================

REM ---------- BACKEND ----------
echo.
echo [BACKEND]
cd backend

IF NOT EXIST node_modules (
    echo Installing backend dependencies...
    npm install
)

start cmd /k "node server.js"
cd ..

REM ---------- FRONTEND ----------
echo.
echo [FRONTEND]
cd frontend

IF NOT EXIST node_modules (
    echo Installing frontend dependencies...
    npm install
)

start cmd /k "npm run dev"
cd ..

echo.
echo App started successfully!
echo Frontend : http://localhost:5173
echo Admin    : http://localhost:5173/admin
echo Backend  : http://localhost:5000
echo ======================================

pause
