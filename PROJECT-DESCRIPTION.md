# Monad x402 Marketplace - Project Description

## What I Built

I created a full-stack code snippet marketplace where developers can buy and sell code snippets using blockchain-based micropayments. Think of it like a mini app store, but for code - you pay just 1 cent (0.01 ETH) to access quality code snippets, and creators get paid instantly.

## The Problem I'm Solving

Developers often need quick code solutions but don't want to commit to expensive subscriptions or dig through unreliable free sources. At the same time, talented developers who write great code snippets have no easy way to monetize their work. I wanted to bridge this gap with instant, fair micropayments.

## How It Works

**For Buyers:**

- Browse through a marketplace of verified code snippets
- Connect your wallet (MetaMask or similar)
- Pay 0.01 ETH to unlock any snippet
- Get instant access - the transaction settles in about 2 seconds on Monad

**For Creators:**

- Submit your code snippets to the marketplace
- Set your wallet address
- Earn 90% of every sale (10% goes to platform maintenance)
- Get paid instantly when someone buys your snippet

**The Cool Part:**
I integrated Groq AI (using Llama 3.1 70B) to automatically fix and update code snippets. Every week, the AI scans all snippets for deprecated APIs, security issues, or outdated patterns and fixes them automatically. So the code stays fresh without creators having to manually update it.

## Tech Stack Breakdown

**Frontend (React + Vite):**

- Clean, modern UI built with React 19
- Web3 wallet integration using Ethers.js
- Deployed on Vercel for instant global access

**Backend (Node.js + Express):**

- REST API handling all marketplace operations
- Supabase for database (storing snippets, payments, user data)
- Deployed on Render with auto-scaling

**Blockchain (Monad Testnet):**

- Smart contracts written in Solidity 0.8.20
- Handles payment splitting (90% creator, 10% platform)
- Uses x402 protocol for micropayments
- 2-second transaction finality (way faster than Ethereum!)

**AI Layer (Groq):**

- Automated code fixing and updates
- Uses Llama 3.1 70B model
- Runs weekly maintenance on all snippets

## Why Monad?

I chose Monad because:

1. **Speed** - 2-second finality means users don't wait around
2. **Low fees** - Micropayments actually make sense when gas is cheap
3. **EVM compatible** - I could use familiar Solidity and tools like Hardhat
4. **Developer-friendly** - Great docs and testnet experience

## Key Features

✅ **Instant Payments** - Smart contract automatically splits payments (90/10)  
✅ **Blockchain Verification** - Every transaction is verified on-chain  
✅ **AI Auto-Fix** - Code stays up-to-date automatically  
✅ **Fair Pricing** - Just 1 cent per snippet  
✅ **Creator-First** - Creators keep 90% of revenue  
✅ **Subscription Discounts** - Buy 10 snippets, get 50% off future purchases

## Technical Highlights

**Smart Contract Design:**

- Implemented a facilitator pattern for x402 payments
- Automatic payment splitting with commission tracking
- Gas-optimized for low-cost transactions
- Owner can withdraw accumulated commissions

**API Architecture:**

- 12 RESTful endpoints for all marketplace operations
- CORS configured for both local dev and production
- Health checks and analytics endpoints
- Integrated with Supabase for data persistence

**AI Integration:**

- Groq SDK for code analysis and fixing
- Batch processing for multiple snippets
- Logging system to track all AI changes
- Configurable fix frequency

## Deployment

**Live URLs:**

- Frontend: https://monad-blitz-sooty.vercel.app
- Backend: https://monad-x402-backend.onrender.com
- Contract: 0x338bBC23F6049fb0FD54a7A8d2e4e26952A0B448

**Infrastructure:**

- Frontend on Vercel (auto-deploys on git push)
- Backend on Render (free tier with auto-scaling)
- Database on Supabase (PostgreSQL + Edge Functions)
- Smart contracts on Monad Testnet

## Challenges I Overcame

1. **CORS Configuration** - Had to properly configure CORS to allow both localhost (for development) and production URLs (for deployment)

2. **Payment Flow** - Implementing the x402 payment protocol and ensuring proper verification both on-chain and in the database

3. **Deployment Structure** - Organizing a monorepo with separate frontend/backend folders while maintaining clean deployment pipelines

4. **AI Integration** - Balancing AI auto-fixes to improve code without breaking functionality

## What's Next

If I had more time, I'd add:

- User profiles and reputation systems
- Code snippet ratings and reviews
- Multi-language support for the UI
- Advanced search and filtering
- Creator analytics dashboard
- NFT receipts for purchases

## Why This Matters

This project shows how blockchain micropayments can create new business models. Instead of paywalls or subscriptions, we can have fair, per-use pricing. Creators get paid instantly, buyers only pay for what they use, and everyone benefits from AI-powered maintenance.

The combination of Monad's speed, Groq's AI capabilities, and modern web tech creates a smooth user experience that feels like a regular web app - but with all the benefits of blockchain ownership and transparency.

---

**Built with:** React, Node.js, Solidity, Monad, Groq AI, Supabase  
**Deployed on:** Vercel + Render  
**Contract:** Monad Testnet  
**Total Development Time:** ~2 days  
**Lines of Code:** ~2,000+
