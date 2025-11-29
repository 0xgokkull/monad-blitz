# Monad x402 Marketplace

Full-stack code snippet marketplace with x402 micropayments, Monad blockchain verification, and Groq AI auto-fix.

## Project Structure

```
├── frontend/          # React + Vite frontend
├── backend/           # Node.js + Express backend + Smart contracts
├── .env              # Environment variables
└── README.md         # This file
```

## Quick Setup

### 1. Install All Dependencies

```bash
npm run install:all
```

### 2. Configure Environment

Create `.env` file in root:

```env
# Groq API (FREE - https://console.groq.com/keys)
GROQ_API_KEY=gsk_...

# Monad Network
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
MONAD_CHAIN_ID=10143
PRIVATE_KEY=your_wallet_private_key

# Contract
X402_FACILITATOR_ADDRESS=deployed_contract_address

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

### 3. Deploy Smart Contracts

```bash
npm run compile:contracts
npm run deploy:contracts
```

### 4. Start Development

```bash
npm run dev  # Starts both frontend and backend
```

Or run separately:

```bash
npm run dev:backend   # Backend on http://localhost:3000
npm run dev:frontend  # Frontend on http://localhost:5173
```

## Features

- **12 REST API endpoints** - Snippets, payments, verification, AI auto-fix, analytics
- **x402 micropayments** - 0.01 ETH per snippet (90% to creator, 10% commission)
- **Monad blockchain verification** - 2-second onchain proof
- **Groq AI auto-fix** - Weekly self-healing code using Llama 3.1 70B
- **Subscription system** - 50% discount after 10 purchases
- **React frontend** - Modern UI with Web3 wallet integration

## Available Scripts

```bash
npm run install:all        # Install all dependencies
npm run dev                # Run both frontend and backend
npm run dev:backend        # Run backend only
npm run dev:frontend       # Run frontend only
npm run build:frontend     # Build frontend for production
npm run test:backend       # Run backend tests
npm run compile:contracts  # Compile smart contracts
npm run deploy:contracts   # Deploy to Monad testnet
```

## Tech Stack

### Frontend

- React 19 + Vite
- Ethers.js v6
- ESLint

### Backend

- Node.js + Express
- Hardhat + Solidity 0.8.20
- Supabase (PostgreSQL + Edge Functions)
- Groq AI (Llama 3.1 70B)
- Ethers.js v6
- Thirdweb SDK

### Blockchain

- Monad Testnet (EVM-compatible)
- Smart contracts for x402 payments

## Documentation

- **Backend API**: See `backend/API-EXAMPLES.md`
- **Frontend**: See `frontend/README.md`
- **Backend**: See `backend/README.md`

## Support

- **Monad**: https://docs.monad.xyz
- **Groq**: https://console.groq.com/docs
- **Supabase**: https://supabase.com/docs
