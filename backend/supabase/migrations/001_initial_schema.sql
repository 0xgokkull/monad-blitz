-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA extensions;

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    wallet_address TEXT UNIQUE,
    username TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Code snippets table
CREATE TABLE public.snippets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    code TEXT NOT NULL,
    language TEXT NOT NULL,
    framework TEXT,
    tags TEXT[],
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    price_cents INTEGER DEFAULT 1,
    read_count INTEGER DEFAULT 0,
    verification_status TEXT DEFAULT 'pending',
    verification_tx_hash TEXT,
    verification_timestamp TIMESTAMP WITH TIME ZONE,
    last_auto_fix TIMESTAMP WITH TIME ZONE,
    auto_fix_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table (x402 micropayments)
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snippet_id UUID REFERENCES public.snippets(id) ON DELETE CASCADE,
    buyer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    buyer_wallet TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    tx_hash TEXT NOT NULL,
    payment_type TEXT DEFAULT 'one-time',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions table (50% after 10 reads)
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    snippet_id UUID REFERENCES public.snippets(id) ON DELETE CASCADE,
    activated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, snippet_id)
);

-- Verification logs (Monad blockchain verification)
CREATE TABLE public.verification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snippet_id UUID REFERENCES public.snippets(id) ON DELETE CASCADE,
    tx_hash TEXT NOT NULL,
    block_number BIGINT,
    verification_result TEXT,
    gas_used BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auto-fix logs (Groq AI fixes)
CREATE TABLE public.auto_fix_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snippet_id UUID REFERENCES public.snippets(id) ON DELETE CASCADE,
    original_code TEXT NOT NULL,
    fixed_code TEXT NOT NULL,
    fix_reason TEXT,
    groq_model TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_snippets_author ON public.snippets(author_id);
CREATE INDEX idx_snippets_verification ON public.snippets(verification_status);
CREATE INDEX idx_snippets_active ON public.snippets(is_active);
CREATE INDEX idx_payments_snippet ON public.payments(snippet_id);
CREATE INDEX idx_payments_buyer ON public.payments(buyer_id);
CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_active ON public.subscriptions(is_active);

-- Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.snippets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_fix_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Snippets are viewable by everyone" ON public.snippets FOR SELECT USING (is_active = true);
CREATE POLICY "Users can create snippets" ON public.snippets FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own snippets" ON public.snippets FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
