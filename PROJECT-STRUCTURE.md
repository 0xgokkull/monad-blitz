# Project Structure

```
monad-x402-marketplace/
├── frontend/                    # React Frontend
│   ├── src/                    # React components and logic
│   ├── public/                 # Static assets
│   ├── package.json            # Frontend dependencies
│   ├── vite.config.js          # Vite configuration
│   ├── index.html              # Entry HTML
│   └── README.md               # Frontend documentation
│
├── backend/                     # Node.js Backend + Smart Contracts
│   ├── contracts/              # Solidity smart contracts
│   │   ├── X402Facilitator.sol
│   │   └── X402FacilitatorV2.sol
│   ├── scripts/                # Deployment scripts
│   │   ├── deploy.js
│   │   ├── deploy-v2.js
│   │   └── interact.js
│   ├── test/                   # Contract tests
│   ├── supabase/               # Database and edge functions
│   ├── deployments/            # Deployment records
│   ├── artifacts/              # Compiled contracts
│   ├── cache/                  # Hardhat cache
│   ├── server-x402.js          # Express API server
│   ├── client-x402.js          # API client
│   ├── cron-autofix.js         # AI auto-fix cron job
│   ├── register-snippets.js    # Snippet registration
│   ├── hardhat.config.js       # Hardhat configuration
│   ├── package.json            # Backend dependencies
│   ├── API-EXAMPLES.md         # API documentation
│   └── README.md               # Backend documentation
│
├── .env                        # Environment variables (not in git)
├── .env.example                # Environment template
├── .gitignore                  # Git ignore rules
├── package.json                # Root package with scripts
├── README.md                   # Main documentation
└── PROJECT-STRUCTURE.md        # This file
```

## Key Files

### Configuration

- `.env` - Environment variables (API keys, wallet, etc.)
- `backend/hardhat.config.js` - Blockchain network configuration
- `frontend/vite.config.js` - Frontend build configuration

### Smart Contracts

- `backend/contracts/X402FacilitatorV2.sol` - Main payment contract

### Backend Services

- `backend/server-x402.js` - REST API server
- `backend/cron-autofix.js` - AI-powered code fixing

### Frontend

- `frontend/src/` - React application source code

## Getting Started

1. Install dependencies: `npm run install:all`
2. Configure `.env` file
3. Deploy contracts: `npm run deploy:contracts`
4. Start development: `npm run dev`
