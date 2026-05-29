@echo off
cd /d "%~dp0"
title TalentMatch Frontend
echo Starting Frontend Server...
node node_modules\next\dist\bin\next dev --turbopack
pause
