# Monad x402 Marketplace Frontend

React-based frontend for the code snippet marketplace with Web3 wallet integration.

## Quick Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create `.env` file:

```env
VITE_API_URL=http://localhost:3000
VITE_CONTRACT_ADDRESS=your_contract_address
VITE_CHAIN_ID=10143
```

### 3. Start Development Server

```bash
npm run dev
```

Visit http://localhost:5173

## Scripts

- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Features

- Browse and purchase code snippets
- Web3 wallet connection (MetaMask, etc.)
- Real-time payment processing
- Blockchain verification status
- User dashboard and analytics

## Tech Stack

- **React 19** - UI library
- **Vite** - Build tool
- **Ethers.js** - Web3 integration
- **ESLint** - Code linting
