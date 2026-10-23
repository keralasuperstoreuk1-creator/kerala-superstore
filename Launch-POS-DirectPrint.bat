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

:: Target URL
set TARGET_URL=https://keralasuperstore.com/pos
set USER_DATA=%LOCALAPPDATA%\KSS_POS_Profile

if not %CHROME%=="" (
    start "" %CHROME% --kiosk-printing --user-data-dir="%USER_DATA%" --app=%TARGET_URL%
) else if not %EDGE%=="" (
    start "" %EDGE% --kiosk-printing --user-data-dir="%USER_DATA%" --app=%TARGET_URL%
) else (
    start %TARGET_URL%
)
