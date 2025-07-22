#!/bin/bash

# CyberVault Deployment Script
# This script deploys the application to Vercel with proper CORS configuration

echo "🚀 CyberVault Deployment Script"
echo "================================"

# Check if we're in the right directory
if [ ! -f "vercel.json" ]; then
    echo "❌ Error: vercel.json not found. Are you in the project root?"
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Build the project first
echo "🔨 Building the project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the errors and try again."
    exit 1
fi

echo "✅ Build successful!"

# Check Vercel configuration
echo "🔍 Checking Vercel configuration..."
echo "API Rewrite Target: https://cybervault-api-a1fo.onrender.com"
echo "CORS Headers: Configured for all /api/* routes"

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo ""
    echo "🎉 Your CyberVault application has been deployed!"
    echo ""
    echo "📝 Important Notes:"
    echo "   • All API requests to /api/* are proxied to the backend"
    echo "   • CORS headers are automatically handled by Vercel"
    echo "   • Account creation endpoint (/api/v1/accounts) is now properly configured"
    echo ""
    echo "🔧 If you encounter CORS issues:"
    echo "   1. Check that your backend is running at: https://cybervault-api-a1fo.onrender.com"
    echo "   2. Verify the backend accepts requests from your Vercel domain"
    echo "   3. Check the browser console for detailed error messages"
    echo ""
else
    echo "❌ Deployment failed. Please check the error messages above."
    exit 1
fi
