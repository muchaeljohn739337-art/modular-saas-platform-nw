#!/bin/bash
# GitHub → Vercel Deployment - Advancia Pay Ledger
# Run this from your repo root: ./deploy-vercel.sh

set -e

echo "=== Advancia Pay Ledger - Vercel Deployment ==="
echo ""

# Install Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

# Navigate to frontend
cd frontend/dashboard-app

# Fix configs
cat > vercel.json << 'EOF'
{
  "buildCommand": "npm run build",
  "framework": "vite"
}
EOF

# Ensure vite config exists
if [ ! -f vite.config.ts ]; then
    cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  server: {
    port: 3000
  }
})
EOF
fi

# Clean install
echo "Installing dependencies..."
rm -rf node_modules dist package-lock.json
npm install

# Test build
echo "Testing build..."
npm run build

# Deploy
echo "Deploying to Vercel..."
echo "When prompted:"
echo "  - Link to existing project? N"
echo "  - What's your project's name? advancia-payledger"
echo ""

vercel --prod

echo ""
echo "✓ DONE! Your app is live."
echo ""
echo "Set environment variables at: https://vercel.com/dashboard"
echo "  VITE_API_URL = your-backend-url"
echo "  VITE_ENVIRONMENT = production"
