@echo off
title Kerala Superstore POS - Direct Silent Print Mode
echo ===================================================================
echo     KERALA SUPERSTORE UK - DIRECT SILENT PRINT TERMINAL
echo ===================================================================
echo.
echo Launching POS in Chrome Kiosk-Printing mode...
echo (Prints directly to default thermal receipt printer - NO PREVIEW!)
echo.

:: 1. Search for Google Chrome
set CHROME=""
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    set CHROME="C:\Program Files\Google\Chrome\Application\chrome.exe"
) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    set CHROME="C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
) else if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" (
    set CHROME="%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
)

:: 2. Search for Microsoft Edge if Chrome is not installed
set EDGE=""
if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    set EDGE="C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
) else if exist "C:\Program Files\Microsoft\Edge\Application\msedge.exe" (
    set EDGE="C:\Program Files\Microsoft\Edge\Application\msedge.exe"
)

:: Target URL (Can be local port 809 or 3000 or live cloud)
set TARGET_URL=http://localhost:809/pos

if not %CHROME%=="" (
    start "" %CHROME% --kiosk-printing --app=%TARGET_URL%
) else if not %EDGE%=="" (
    start "" %EDGE% --kiosk-printing --app=%TARGET_URL%
) else (
    start %TARGET_URL%
)
