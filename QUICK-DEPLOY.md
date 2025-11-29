# ⚡ Quick Deploy Guide

## 1️⃣ Deploy Contracts (5 min)

```bash
cd backend
npm install
npm run compile
npm run deploy
```

**Save the contract address!** You'll need it for both deployments.

---

## 2️⃣ Deploy Backend to Render (3 min)

1. **Go to**: https://render.com
2. **New Web Service** → Connect GitHub repo
3. **Settings**:
   - Root Directory: `backend`
   - Build: `npm install`
   - Start: `npm start`
4. **Add 11 Environment Variables** (copy from `backend/.env.render`):
   - GROQ_API_KEY (get from https://console.groq.com/keys)
   - X402_CONTRACT_ADDRESS (from step 1)
   - PRIVATE_KEY, RECIPIENT_WALLET (your wallet)
   - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
   - Others from template
5. **Deploy** → Copy your URL: `https://xxx.onrender.com`

---

## 3️⃣ Deploy Frontend to Vercel (2 min)

1. **Go to**: https://vercel.com
2. **New Project** → Import GitHub repo
3. **Settings**:
   - Root Directory: `frontend`
   - Framework: Vite
4. **Add 4 Environment Variables** (copy from `frontend/.env.vercel`):
   - VITE_API_URL (your Render URL from step 2)
   - VITE_CONTRACT_ADDRESS (from step 1)
   - VITE_CHAIN_ID=10143
   - VITE_RPC_URL=https://testnet-rpc.monad.xyz
5. **Deploy** → Your app is live! 🎉

---

## 4️⃣ Update Backend CORS (1 min)

1. Go back to **Render**
2. Add environment variable:
   - `FRONTEND_URL` = your Vercel URL
3. **Redeploy**

---

## ✅ Done!

Your app is live:

- **Frontend**: https://your-app.vercel.app
- **Backend**: https://your-backend.onrender.com
- **Total time**: ~10 minutes
- **Total cost**: $0

---

## 🔑 Required Keys

Before deploying, get these:

1. **Groq API Key** (FREE): https://console.groq.com/keys
2. **Supabase Project** (FREE): https://supabase.com
3. **Wallet Private Key**: Your Monad testnet wallet
4. **Contract Address**: Deploy contracts first

---

## 📋 Environment Variables Cheat Sheet

### Render (Backend) - 11 vars

```
NODE_ENV=production
PORT=3000
GROQ_API_KEY=gsk_...
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
MONAD_CHAIN_ID=10143
PRIVATE_KEY=0x...
RECIPIENT_WALLET=0x...
X402_CONTRACT_ADDRESS=0x...
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
FRONTEND_URL=https://...vercel.app
```

### Vercel (Frontend) - 4 vars

```
VITE_API_URL=https://...onrender.com
VITE_CONTRACT_ADDRESS=0x...
VITE_CHAIN_ID=10143
VITE_RPC_URL=https://testnet-rpc.monad.xyz
```
