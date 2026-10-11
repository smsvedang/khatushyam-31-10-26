@echo off
title ShiVe Tours - WhatsApp Web Bot Service
color 0A
echo ==============================================================================
echo           ShiVe Tours and Travels - WhatsApp Automation Hub
echo             खाटू श्याम जी दर्शन यात्रा (31-10-2026)
echo ==============================================================================
echo.
echo [1/3] Checking Node.js installation...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed! Please install Node.js from https://nodejs.org/
    pause
    exit /b
)

echo [2/3] Opening WhatsApp Web Dashboard in browser...
start http://localhost:5000

echo [3/3] Starting WhatsApp Automation Server on Port 5000...
echo.
echo  * कृपया ब्राउजर में खुले पेज पर QR Code अपने WhatsApp से स्कैन करें।
echo  * एक बार स्कैन करने के बाद जब भी कोई वेबसाइट पर सीट बुक करेगा,
echo    आपके WhatsApp से ऑटोमैटिक कन्फर्मेशन मैसेज चला जाएगा!
echo.
echo ==============================================================================
cd /d "%~dp0whatsapp-service"
node server.js
pause
