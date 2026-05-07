@echo off
title LangLearn App Starter

echo Starting LangLearn Application...
echo.

:: Start Frontend in a new window
echo Starting Frontend on http://localhost:3000
start "LangLearn Frontend" cmd /k "cd /d \"C:\CLG PROJECT\new proj\frontend\" && npm start"

:: Start Backend in a new window
echo Starting Backend on http://localhost:8000
start "LangLearn Backend" cmd /k "cd /d \"C:\CLG PROJECT\new proj\backend\" && if exist .\venv\Scripts\python.exe (.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000) else (python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000)"

echo.
echo Servers are starting in separate windows.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:8000
echo.
echo Keep those windows open to keep the app running!
pause
