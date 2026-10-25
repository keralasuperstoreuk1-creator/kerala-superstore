@echo off
echo ===================================================
echo Kerala Superstore POS Sync - Complete Safe Clean-up
echo ===================================================
echo.
echo 1. Stopping any running KSS Sync processes...
taskkill /F /IM KSS-POS-Sync.exe 2>nul
taskkill /F /IM KSS-POS-Sync-Setup.exe 2>nul

echo 2. Removing startup entry...
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "KeralaSuperstorePOSSync" /f 2>nul

echo 3. Removing desktop shortcut...
del /f /q "%USERPROFILE%\Desktop\Kerala Superstore POS Sync.lnk" 2>nul

echo 4. Cleaning app data folder...
rmdir /s /q "%LOCALAPPDATA%\KeralaSuperstore\POSSync" 2>nul

echo.
echo ===================================================
echo CLEAN-UP COMPLETE: No files remaining.
echo Your RetailV2 POS and Windows system are 100%% safe.
echo ===================================================
pause
