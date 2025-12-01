# Alith x402 Marketplace

Alith x402 Marketplace is a full-stack decentralized application where developers can buy and sell code snippets using instant micropayments. It leverages Alith's AI agents to ensure the code library remains high-quality and up-to-date.

## Key Features

- **AI Auto-Fix with Alith:** An integrated Alith agent (using Llama 3.1) automatically scans snippets to fix deprecated code, security issues, and bugs, keeping the entire library self-maintaining without manual intervention.
- **x402 Micropayments:** Users pay a small fee to unlock snippets, with payments settling instantly on the blockchain.
- **Creator-First Economy:** Smart contracts automatically split revenue, ensuring creators receive 90% of every sale directly.
- **On-Chain Verification:** Every access and purchase is verified on the blockchain for complete transparency.

## Tech Stack

- **AI:** Alith (Agent Framework)
- **Frontend:** React 19, Vite, Ethers.js
- **Backend:** Node.js, Express, Supabase
- **Blockchain:** Solidity Smart Contracts

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
