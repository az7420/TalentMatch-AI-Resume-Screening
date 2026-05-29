@echo off
cd /d "%~dp0"
title TalentMatch Backend
echo Starting Backend Server...
call venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
pause
