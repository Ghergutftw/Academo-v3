@echo off
cls
echo.
echo ========================================
echo   STUDENT MANAGEMENT - BACKEND SERVER
echo ========================================
echo.
echo This will start the PHP backend server
echo.
echo Server URL: http://localhost:8001
echo.
echo IMPORTANT:
echo   - Keep this window OPEN while using the app
echo   - Press Ctrl+C to stop the server
echo   - DO NOT close this window until you're done
echo.
echo ========================================
echo.
echo Starting server...
echo.

cd /d "%~dp0"
php -S localhost:8001

echo.
echo Server stopped.
pause

