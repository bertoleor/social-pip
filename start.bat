@echo off
echo Starting Social-Pip...
echo.
echo [1/3] Starting Frontend...
start cmd /k "cd apps/desktop && pnpm dev"
echo.
echo [2/3] Waiting for Vite to start (5 seconds)...
timeout /t 5 /nobreak
echo.
echo [3/3] Opening browser...
start http://localhost:1420
echo.
echo Social-Pip is running!
echo Press Ctrl+C to stop.
pause
