#!/bin/bash

# Bot Service Type Check and Lint Verification Script
# This script verifies all bots are properly configured and type-safe

set -e

echo "🔍 Verifying Bot Service Configuration..."
echo ""

BOTS=("discord-bot" "telegram-bot" "twitter-bot" "farcaster-bot")
ERRORS=0

for BOT in "${BOTS[@]}"; do
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📦 Checking $BOT..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    cd "$BOT"
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        echo "❌ package.json not found!"
        ERRORS=$((ERRORS + 1))
        cd ..
        continue
    fi
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo "📥 Installing dependencies..."
        npm install
    fi
    
    # Type check
    echo "🔍 Running type check..."
    if npm run type-check; then
        echo "✅ Type check passed"
    else
        echo "❌ Type check failed"
        ERRORS=$((ERRORS + 1))
    fi
    
    # Lint check
    echo "🔍 Running lint check..."
    if npm run lint; then
        echo "✅ Lint check passed"
    else
        echo "⚠️  Lint warnings found (auto-fixing...)"
        npm run lint:fix || true
    fi
    
    # Check for .env.example
    if [ -f ".env.example" ]; then
        echo "✅ .env.example found"
    else
        echo "❌ .env.example not found"
        ERRORS=$((ERRORS + 1))
    fi
    
    # Check for Dockerfile
    if [ -f "Dockerfile" ]; then
        echo "✅ Dockerfile found"
    else
        echo "❌ Dockerfile not found"
        ERRORS=$((ERRORS + 1))
    fi
    
    # Check for README
    if [ -f "README.md" ]; then
        echo "✅ README.md found"
    else
        echo "❌ README.md not found"
        ERRORS=$((ERRORS + 1))
    fi
    
    echo ""
    cd ..
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Verification Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $ERRORS -eq 0 ]; then
    echo "✅ All bots verified successfully!"
    echo ""
    echo "🚀 Ready for deployment!"
    echo ""
    echo "Next steps:"
    echo "  1. Copy .env.example to .env and configure"
    echo "  2. Run: docker-compose build"
    echo "  3. Run: docker-compose up -d"
    exit 0
else
    echo "❌ Found $ERRORS error(s)"
    echo ""
    echo "Please fix the errors above before deploying."
    exit 1
fi
