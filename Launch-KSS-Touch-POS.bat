@echo off
title Kerala Superstore Touch POS Terminal
echo ========================================================
echo   KERALA SUPERSTORE UK - TOUCH POS TERMINAL (TILL 01)
echo   Connecting to Manchester Store POS & Barcode Database...
echo ========================================================

python tools\pos_app\kss_touch_pos.py 809
if errorlevel 1 (
    echo Launching via default browser on Port 809...
    start http://localhost:809/pos
)
