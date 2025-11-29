#!/bin/bash

echo "🚀 Setting up Monad x402 Marketplace Backend..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    npm install -g supabase
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please fill in your credentials in .env file"
    exit 1
fi

# Initialize Supabase
echo "🔧 Initializing Supabase..."
supabase init

# Start Supabase locally
echo "🏃 Starting Supabase locally..."
supabase start

# Run migrations
echo "📊 Running database migrations..."
supabase db push

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Fill in your .env file with Supabase and Groq credentials"
echo "2. Deploy edge function: supabase functions deploy api"
echo "3. Test API: node test-api.js"
