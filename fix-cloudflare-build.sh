#!/bin/bash

# 🔧 CLOUDFLARE PAGES BUILD FIX
echo "🔧 FIXING CLOUDFLARE PAGES BUILD ERRORS"
echo "======================================"
echo ""

echo "🚨 ERRORS IDENTIFIED:"
echo "• No routes found in Functions directory"
echo "• Output directory 'frontend/out' not found"
echo "• Build process failing"
echo ""

echo "🛠️ SOLUTION STEPS:"
echo ""

echo "Step 1: Check frontend directory structure..."
cd "c:\Users\mucha.DESKTOP-H7T9NPM\Downloads\productition"
if [ -d "frontend" ]; then
    echo "✅ Frontend directory exists"
    cd frontend
    echo "📁 Current directory contents:"
    ls -la
    echo ""
    
    echo "Step 2: Check if package.json exists..."
    if [ -f "package.json" ]; then
        echo "✅ package.json found"
        echo "📋 Build scripts in package.json:"
        cat package.json | grep -A 10 '"scripts"'
        echo ""
        
        echo "Step 3: Install dependencies..."
        npm install
        echo ""
        
        echo "Step 4: Create/update next.config.js for static export..."
        cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  assetPrefix: process.env.NODE_ENV === 'production' 
    ? 'https://advanciapayledger.com' 
    : undefined,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://api.advanciapayledger.com',
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://advanciapayledger.com',
  }
}

module.exports = nextConfig
EOF
        echo "✅ next.config.js created for static export"
        echo ""
        
        echo "Step 5: Update package.json with correct build scripts..."
        # Check if jq is available for JSON manipulation
        if command -v jq &> /dev/null; then
            jq '.scripts.build = "next build"' package.json > temp.json && mv temp.json package.json
            jq '.scripts.export = "next export"' package.json > temp.json && mv temp.json package.json
            jq '.scripts."build:static" = "next build && next export"' package.json > temp.json && mv temp.json package.json
        else
            echo "⚠️ jq not found, please manually update package.json scripts"
        fi
        echo ""
        
        echo "Step 6: Run build locally to test..."
        echo "🔧 Running: npm run build"
        npm run build
        echo ""
        
        echo "Step 7: Run export..."
        echo "🔧 Running: npm run export"
        npm run export
        echo ""
        
        echo "Step 8: Check if out directory was created..."
        if [ -d "out" ]; then
            echo "✅ out directory created successfully!"
            echo "📁 Contents of out directory:"
            ls -la out/
            echo ""
            
            echo "Step 9: Create _redirects file for proper routing..."
            cat > out/_redirects << 'EOF'
/*    /index.html   200
EOF
            echo "✅ _redirects file created"
            echo ""
            
            echo "Step 10: Create _headers file for security..."
            cat > out/_headers << 'EOF'
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: "1; mode=block"
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()

/api/*
  Access-Control-Allow-Origin: https://advanciapayledger.com
  Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
  Access-Control-Allow-Headers: Content-Type, Authorization
EOF
            echo "✅ _headers file created"
            echo ""
            
        else
            echo "❌ out directory still not created"
            echo "🔍 Checking for alternative output directories..."
            if [ -d ".next" ]; then
                echo "📁 Found .next directory"
                ls -la .next/
            fi
            if [ -d "dist" ]; then
                echo "📁 Found dist directory"
                ls -la dist/
            fi
            if [ -d "build" ]; then
                echo "📁 Found build directory"
                ls -la build/
            fi
        fi
        
    else
        echo "❌ package.json not found in frontend directory"
        echo "🔍 Creating basic package.json..."
        cat > package.json << 'EOF'
{
  "name": "advancia-payledger-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "export": "next export",
    "build:static": "next build && next export",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "^14.0.0",
    "typescript": "^5.0.0"
  }
}
EOF
        echo "✅ Basic package.json created"
        echo "📦 Please run: npm install && npm run build:static"
    fi
    
else
    echo "❌ Frontend directory not found"
    echo "🔍 Checking current directory structure..."
    ls -la
    echo ""
    echo "📁 Available directories:"
    find . -maxdepth 2 -type d -name "*frontend*" -o -name "*web*" -o -name "*app*" -o -name "*client*"
fi

echo ""
echo "🎯 CLOUDFLARE PAGES CONFIGURATION UPDATE:"
echo "=========================================="
echo ""
echo "After fixing the build, update your Cloudflare Pages settings:"
echo ""
echo "Option 1: If 'out' directory was created:"
echo "  • Build Command: npm run build && npm run export"
echo "  • Output Directory: out"
echo "  • Root Directory: frontend"
echo ""
echo "Option 2: If only '.next' directory exists:"
echo "  • Build Command: npm run build"
echo "  • Output Directory: .next"
echo "  • Root Directory: frontend"
echo ""
echo "Option 3: If 'dist' directory exists:"
echo "  • Build Command: npm run build"
echo "  • Output Directory: dist"
echo "  • Root Directory: frontend"
echo ""
echo "Option 4: Fallback to static HTML:"
echo "  • Build Command: echo 'No build required'"
echo "  • Output Directory: ."
echo "  • Root Directory: frontend"
echo ""

echo "🔧 ENVIRONMENT VARIABLES (add these):"
echo "NEXT_PUBLIC_API_URL=https://api.advanciapayledger.com"
echo "NEXT_PUBLIC_SITE_URL=https://advanciapayledger.com"
echo "NEXT_PUBLIC_HIPAA_MODE=true"
echo "NODE_ENV=production"
echo ""

echo "✅ Build fix process completed!"
