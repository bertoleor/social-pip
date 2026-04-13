@echo off
echo Setting up Social-Pip development environment...
echo.
echo [1/4] Installing dependencies...
call pnpm install
echo.
echo [2/4] Generating Prisma client...
cd packages/database && call pnpm db:generate && cd ../..
echo.
echo [3/4] Running database migrations...
cd packages/database && call pnpm db:migrate && cd ../..
echo.
echo [4/4] Building extension...
cd apps/extension && call pnpm build && cd ../..
echo.
echo Setup complete! Run 'start.bat' to launch the app.
pause
