@echo off
title Swift Junk Removal v3 preview
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is needed for the local preview. Opening the file directly instead.
  start "" "%~dp0index.html"
  exit /b
)
node serve.cjs
