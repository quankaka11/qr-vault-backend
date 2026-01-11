@echo off
echo 🔍 Checking Backend Deployment Readiness...
echo.

REM Check if in correct directory
if not exist "index.js" (
    echo ❌ Error: Please run this script from the 'sever' directory
    exit /b 1
)

REM Check package.json
if not exist "package.json" (
    echo ❌ Error: package.json not found
    exit /b 1
) else (
    echo ✅ package.json found
)

REM Check dependencies
if not exist "node_modules" (
    echo ⚠️  Warning: node_modules not found. Run 'npm install' first
) else (
    echo ✅ node_modules found
)

REM Check required files
if exist "index.js" (echo ✅ index.js exists) else (echo ❌ index.js missing)
if exist "railway.json" (echo ✅ railway.json exists) else (echo ❌ railway.json missing)
if exist ".env.example" (echo ✅ .env.example exists) else (echo ❌ .env.example missing)
if exist ".gitignore" (echo ✅ .gitignore exists) else (echo ❌ .gitignore missing)

REM Check if git initialized
if exist ".git" (
    echo ✅ Git initialized
) else (
    echo ⚠️  Git not initialized. Run 'git init'
)

echo.
echo 📋 Next Steps:
echo 1. Make sure all files are committed: git add . ^&^& git commit -m "Ready for deploy"
echo 2. Create GitHub repository
echo 3. Push to GitHub: git push -u origin main
echo 4. Deploy on Railway
echo.
echo See DEPLOY_CHECKLIST.md for detailed steps

pause
