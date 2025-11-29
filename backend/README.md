# Monad x402 Marketplace Backend

Complete backend for verified code snippet marketplace with x402 payments, Monad blockchain verification, and Groq AI auto-fix.

## Quick Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` from root and fill in:

- `GROQ_API_KEY` - Get from https://console.groq.com/keys
- `X402_FACILITATOR_ADDRESS` - Your deployed contract address
- `PRIVATE_KEY` - Your wallet private key
- Supabase credentials

### 3. Deploy Smart Contracts

```bash
npm run compile
npm run deploy
```

### 4. Start Server

```bash
npm start        # Production
npm run dev      # Development with auto-reload
```

## Scripts

- `npm start` - Start Express server
- `npm run dev` - Start with nodemon (auto-reload)
- `npm run autofix` - Run AI auto-fix cron job
- `npm test` - Run Hardhat tests
- `npm run compile` - Compile smart contracts
- `npm run deploy` - Deploy contracts to Monad testnet

## API Endpoints

See `API-EXAMPLES.md` for full documentation.

## Tech Stack

- **Node.js + Express** - REST API server
- **Hardhat + Solidity** - Smart contract development
- **Ethers.js** - Blockchain interaction
- **Supabase** - Database and edge functions
- **Groq AI** - Code auto-fix
