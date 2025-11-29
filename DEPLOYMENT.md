# Deployment Guide

## 🚀 Quick Deploy

### Backend → Render

### Frontend → Vercel

---

## 📦 Backend Deployment (Render)

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 2: Deploy on Render

1. Go to **https://render.com** → Sign up/Login
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `monad-x402-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

### Step 3: Add Environment Variables

In Render dashboard, add these environment variables:

```env
NODE_ENV=production
PORT=3000

# Groq AI (Get from https://console.groq.com/keys)
GROQ_API_KEY=gsk_your_key_here

# Monad Network
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
MONAD_CHAIN_ID=10143

# Your Wallet
PRIVATE_KEY=your_private_key_here
RECIPIENT_WALLET=your_wallet_address_here

# Contract (After deploying contracts)
X402_CONTRACT_ADDRESS=0x_your_contract_address

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_key_here

# Frontend URL (Update after Vercel deployment)
FRONTEND_URL=https://your-app.vercel.app

# Thirdweb (Optional)
THIRDWEB_SECRET_KEY=your_thirdweb_key
```

### Step 4: Deploy

- Click **"Create Web Service"**
- Wait 2-3 minutes for deployment
- Copy your backend URL: `https://your-backend.onrender.com`

---

## 🎨 Frontend Deployment (Vercel)

### Step 1: Deploy on Vercel

1. Go to **https://vercel.com** → Sign up/Login
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Step 2: Add Environment Variables

In Vercel dashboard → Settings → Environment Variables:

```env
# Backend API (Your Render URL)
VITE_API_URL=https://your-backend.onrender.com

# Contract Address
VITE_CONTRACT_ADDRESS=0x_your_contract_address

# Monad Network
VITE_CHAIN_ID=10143
VITE_RPC_URL=https://testnet-rpc.monad.xyz
VITE_NETWORK_NAME=Monad Testnet
```

### Step 3: Deploy

- Click **"Deploy"**
- Wait 1-2 minutes
- Your app is live at: `https://your-app.vercel.app`

### Step 4: Update Backend CORS

- Go back to Render
- Update `FRONTEND_URL` to your Vercel URL
- Redeploy backend

---

## 🔧 Deploy Smart Contracts First

Before deploying backend/frontend, deploy your contracts:

```bash
cd backend
npm run compile
npm run deploy
```

Copy the deployed contract address and use it in environment variables.

---

## ✅ Deployment Checklist

- [ ] Deploy smart contracts to Monad testnet
- [ ] Get Groq API key from https://console.groq.com/keys
- [ ] Set up Supabase project
- [ ] Push code to GitHub
- [ ] Deploy backend to Render with all env vars
- [ ] Deploy frontend to Vercel with all env vars
- [ ] Update FRONTEND_URL in Render
- [ ] Test the live application

---

## 🔍 Testing Deployment

### Test Backend

```bash
curl https://your-backend.onrender.com/health
```

### Test Frontend

Visit `https://your-app.vercel.app` in browser

---

## 💰 Costs

- **Render Free Tier**: $0/month (spins down after 15 min inactivity)
- **Vercel Free Tier**: $0/month (100GB bandwidth)
- **Supabase Free Tier**: $0/month (500MB database)
- **Groq API**: $0/month (free tier)

**Total: $0/month** for development/testing

---

## 🆘 Troubleshooting

### Backend not starting?

- Check Render logs for errors
- Verify all environment variables are set
- Ensure `PORT` is set to `3000`

### Frontend can't connect to backend?

- Check `VITE_API_URL` matches your Render URL
- Verify CORS is configured in backend
- Check browser console for errors

### Contract calls failing?

- Verify `X402_CONTRACT_ADDRESS` is correct
- Check `PRIVATE_KEY` has funds
- Ensure Monad RPC URL is accessible

---

## 📝 Environment Variables Summary

### Backend (Render) - 11 variables

1. NODE_ENV
2. PORT
3. GROQ_API_KEY
4. MONAD_RPC_URL
5. MONAD_CHAIN_ID
6. PRIVATE_KEY
7. RECIPIENT_WALLET
8. X402_CONTRACT_ADDRESS
9. SUPABASE_URL
10. SUPABASE_SERVICE_ROLE_KEY
11. FRONTEND_URL

### Frontend (Vercel) - 4 variables

1. VITE_API_URL
2. VITE_CONTRACT_ADDRESS
3. VITE_CHAIN_ID
4. VITE_RPC_URL
