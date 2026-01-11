#!/bin/bash

echo "🔍 Checking Backend Deployment Readiness..."
echo ""

# Check if in correct directory
if [ ! -f "index.js" ]; then
    echo "❌ Error: Please run this script from the 'sever' directory"
    exit 1
fi

# Check package.json
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found"
    exit 1
else
    echo "✅ package.json found"
fi

# Check dependencies
if [ ! -d "node_modules" ]; then
    echo "⚠️  Warning: node_modules not found. Run 'npm install' first"
else
    echo "✅ node_modules found"
fi

# Check required files
files=("index.js" "railway.json" ".env.example" ".gitignore")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
    fi
done

# Check if git initialized
if [ -d ".git" ]; then
    echo "✅ Git initialized"
else
    echo "⚠️  Git not initialized. Run 'git init'"
fi

echo ""
echo "📋 Next Steps:"
echo "1. Make sure all files are committed: git add . && git commit -m 'Ready for deploy'"
echo "2. Create GitHub repository"
echo "3. Push to GitHub: git push -u origin main"
echo "4. Deploy on Railway"
echo ""
echo "See DEPLOY_CHECKLIST.md for detailed steps"
