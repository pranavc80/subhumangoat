@echo off
echo Starting McKinney Orbit...

:: Start Backend
start cmd /k "echo Starting Backend... && cd mk-backend && bun run index.ts"

:: Start Frontend
start cmd /k "echo Starting Frontend... && cd mk-frontend && npm run dev"

echo Both services are starting in separate windows.
pause
