#!/bin/bash

echo "🚀 Deploying Monad x402 Marketplace Backend..."

# Check if logged in to Supabase
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase. Please run: supabase login"
    exit 1
fi

# Deploy edge function
echo "📤 Deploying edge function..."
supabase functions deploy api --no-verify-jwt

# Set environment variables
echo "🔐 Setting environment variables..."
supabase secrets set GROQ_API_KEY="$(grep GROQ_API_KEY .env | cut -d '=' -f2)"
supabase secrets set MONAD_RPC_URL="$(grep MONAD_RPC_URL .env | cut -d '=' -f2)"
supabase secrets set X402_FACILITATOR_ADDRESS="$(grep X402_FACILITATOR_ADDRESS .env | cut -d '=' -f2)"

echo "✅ Deployment complete!"
echo ""
echo "Your API is live at:"
echo "https://your-project.supabase.co/functions/v1/api"
