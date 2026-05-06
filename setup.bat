@echo off
echo ================================================
echo  TaskFlow - Team Task Manager Setup
echo ================================================
echo.

echo [1/4] Installing server dependencies...
cd server
call npm install
if %errorlevel% neq 0 (echo ERROR: npm install failed in server && pause && exit /b 1)

echo.
echo [2/4] Setting up server .env file...
if not exist .env (
  copy .env.example .env
  echo Created server/.env - PLEASE EDIT IT with your DATABASE_URL and JWT_SECRET before continuing
  echo.
  echo Press any key after editing server/.env ...
  pause > nul
)

echo.
echo [3/4] Installing client dependencies...
cd ..\client
call npm install
if %errorlevel% neq 0 (echo ERROR: npm install failed in client && pause && exit /b 1)

echo.
echo [4/4] Setting up client .env file...
if not exist .env (
  copy .env.example .env
  echo Created client/.env
)

echo.
echo ================================================
echo  Setup complete!
echo ================================================
echo.
echo Next steps:
echo  1. Edit server\.env with your DATABASE_URL
echo  2. Run: cd server ^&^& npx prisma migrate dev --name init
echo  3. Run: npm run db:seed
echo  4. In one terminal: cd server ^&^& npm run dev
echo  5. In another terminal: cd client ^&^& npm run dev
echo  6. Open http://localhost:5173
echo.
echo Demo accounts after seeding:
echo   Admin:  admin@demo.com  / admin123
echo   Member: alice@demo.com  / member123
echo   Member: bob@demo.com    / member123
echo.
pause
