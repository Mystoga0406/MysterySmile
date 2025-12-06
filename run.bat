@echo off
echo 🚀 Starting Mystery Smile App (Smart Mode)...

REM ---------- BACKEND ----------
echo 🔧 Backend setup...
cd backend

IF NOT EXIST node_modules (
    echo 📦 Installing backend dependencies...
    npm install
)

start cmd /k "node server.js"
cd ..

REM ---------- FRONTEND ----------
echo 🎨 Frontend setup...
cd frontend

IF NOT EXIST node_modules (
    echo 📦 Installing frontend dependencies...
    npm install
)

start cmd /k "npm run dev"
cd ..

echo ✅ App started successfully!
