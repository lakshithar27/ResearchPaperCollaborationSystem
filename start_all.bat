@echo off
echo ============================================================
echo   ResearchHub - Research Paper Collaboration System
echo   Launching Backend (FastAPI :8000) and Frontend (Next.js :3000)
echo ============================================================

start "ResearchHub Backend (FastAPI)" cmd /k "cd /d %~dp0backend && python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"
timeout /t 3 /nobreak >nul
start "ResearchHub Frontend (Next.js)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo Both services launched!
echo - Frontend: http://localhost:3000
echo - Backend API Docs: http://localhost:8000/docs
echo ============================================================
pause
