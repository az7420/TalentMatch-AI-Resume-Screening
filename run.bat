@echo off
title TalentMatch AI Runner

echo ========================================================
echo               TalentMatch AI Runner
echo ========================================================
echo.
echo [+] Starting Backend Server in a new window...
start "TalentMatch Backend" "%~dp0backend\run_backend.bat"

echo [+] Starting Frontend Server in a new window...
start "TalentMatch Frontend" "%~dp0frontend\run_frontend.bat"

echo.
echo ========================================================
echo  Both servers have been launched!
echo.
echo  Backend API Docs:  http://localhost:8000/docs
echo  Frontend URL:       http://localhost:3000
echo ========================================================
echo.
pause
