# Monad x402 Marketplace Backend

Complete backend for verified code snippet marketplace with x402 payments, Monad blockchain verification, and Groq AI auto-fix.

## Quick Setup

### 1. Fill `.env` file

You need 3 things:

#### ✅ Supabase (You already have this!)

Already in your `.env` file

#### 🤖 Groq API Key (FREE - takes 30 seconds)

1. Go to: **https://console.groq.com/keys**
2. Sign up with Google/GitHub
3. Click "Create API Key"
4. Copy the key (starts with `gsk_`)
5. Paste in `.env` → `GROQ_API_KEY=`

#### 💰 Your Wallet Address

Use your Monad testnet wallet address
Paste in `.env` → `X402_FACILITATOR_ADDRESS=`

### 2. Deploy

```bash
# Install dependencies
npm install

# Deploy database
supabase db push

# Deploy API
supabase functions deploy api
```

### 3. Test

```bash
node test-api.js
```

## What You Get

- **12 REST API endpoints** (snippets, payments, verification, AI auto-fix, analytics)
- **6 database tables** (profiles, snippets, payments, subscriptions, logs)
- **x402 micropayments** (1¢ per snippet)
- **Monad blockchain verification** (2-second onchain proof)
- **Groq AI auto-fix** (weekly self-healing code)
- **Subscription system** (50% discount after 10 reads)

## API Endpoints

| Endpoint                      | Method | Description                 |
| ----------------------------- | ------ | --------------------------- |
| `/health`                     | GET    | Health check                |
| `/snippets`                   | POST   | Create snippet              |
| `/snippets`                   | GET    | List all snippets           |
| `/snippets/:id`               | GET    | Get snippet by ID           |
| `/payments/process`           | POST   | Process x402 payment        |
| `/payments/check/:id/:wallet` | GET    | Check payment status        |
| `/verify/:id`                 | POST   | Verify on Monad blockchain  |
| `/verify/:id/status`          | GET    | Get verification status     |
| `/autofix/:id`                | POST   | AI auto-fix snippet         |
| `/autofix/batch`              | POST   | Batch auto-fix all snippets |
| `/stats`                      | GET    | Marketplace statistics      |
| `/stats/user/:wallet`         | GET    | User statistics             |

## Tech Stack

- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **API**: Hono framework
- **AI**: Groq (Llama 3.1 70B)
- **Blockchain**: Monad Testnet
- **Runtime**: Deno

## Cost

- **Development**: $0 (all free tiers)
- **Production**: ~$25/month (Supabase Pro)

## Files

```
├── .env                                    # Your credentials
├── supabase/
│   ├── migrations/001_initial_schema.sql   # Database schema
│   └── functions/api/index.ts              # API implementation
├── test-api.js                             # Test suite
└── test-curl.sh                            # cURL tests
```

## Support

- **Supabase**: https://supabase.com/docs
- **Groq**: https://console.groq.com/docs
- **Monad**: https://docs.monad.xyz
