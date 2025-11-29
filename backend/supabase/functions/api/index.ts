import { Hono } from "hono";
import { cors } from "hono/cors";
import { createClient } from "@supabase/supabase-js";
import Groq from "groq-sdk";
import { ethers } from "ethers";

const app = new Hono().basePath("/api");
app.use("/*", cors());

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const groq = new Groq({ apiKey: Deno.env.get("GROQ_API_KEY") ?? "" });
const monadProvider = new ethers.JsonRpcProvider(Deno.env.get("MONAD_RPC_URL") ?? "https://testnet-rpc.monad.xyz");

// Root & Health
app.get("/", (c) => c.json({ success: true, status: "ok", message: "Monad x402 Marketplace API", timestamp: new Date().toISOString() }));
app.get("/health", (c) => c.json({ success: true, status: "ok", timestamp: new Date().toISOString() }));

// Snippets
app.post("/snippets", async (c) => {
  try {
    const { title, description, code, language, framework, tags, author_wallet } = await c.req.json();
    const { data: profile } = await supabase.from("profiles").select("id").eq("wallet_address", author_wallet).single();
    let authorId = profile?.id;
    if (!authorId) {
      const { data: newProfile } = await supabase.from("profiles").insert({ wallet_address: author_wallet }).select("id").single();
      authorId = newProfile?.id;
    }
    const { data, error } = await supabase.from("snippets").insert({ title, description, code, language, framework, tags, author_id: authorId }).select().single();
    if (error) throw error;
    return c.json({ success: true, data }, 201);
  } catch (error) {
    return c.json({ success: false, error: error.message }, 400);
  }
});

app.get("/snippets", async (c) => {
  const { data, error } = await supabase.from("snippets").select("*, profiles:author_id(wallet_address, username)").eq("is_active", true).order("created_at", { ascending: false });
  if (error) return c.json({ success: false, error: error.message }, 400);
  return c.json({ success: true, data });
});

app.get("/snippets/:id", async (c) => {
  const { data, error } = await supabase.from("snippets").select("*, profiles:author_id(wallet_address, username)").eq("id", c.req.param("id")).single();
  if (error) return c.json({ success: false, error: error.message }, 404);
  return c.json({ success: true, data });
});

// Payments
app.post("/payments/process", async (c) => {
  try {
    const { snippet_id, buyer_wallet, tx_hash } = await c.req.json();
    
    // Validate transaction hash format (must be 66 characters: 0x + 64 hex chars)
    if (!tx_hash || !tx_hash.match(/^0x[0-9a-fA-F]{64}$/)) {
      return c.json({ 
        success: false, 
        error: "Invalid transaction hash format. Must be 66 characters (0x + 64 hex)",
        required_format: "0x + 64 hex characters"
      }, 400);
    }
    
    // REQUIRE real transaction verification on Monad blockchain
    let transaction;
    try {
      transaction = await monadProvider.getTransaction(tx_hash);
      if (!transaction) {
        return c.json({ 
          success: false, 
          error: "Transaction not found on Monad blockchain. Please submit a real transaction first.",
          tx_hash 
        }, 400);
      }
      
      // Verify transaction is confirmed
      if (!transaction.blockNumber) {
        return c.json({ 
          success: false, 
          error: "Transaction not yet confirmed on Monad blockchain. Please wait for confirmation.",
          tx_hash 
        }, 400);
      }
      
      console.log("✅ Real Monad transaction verified:", tx_hash, "Block:", transaction.blockNumber);
    } catch (err) {
      return c.json({ 
        success: false, 
        error: `Failed to verify transaction on Monad blockchain: ${err.message}`,
        tx_hash,
        monad_rpc: Deno.env.get("MONAD_RPC_URL")
      }, 400);
    }
    
    const { data: profile } = await supabase.from("profiles").select("id").eq("wallet_address", buyer_wallet).single();
    let buyerId = profile?.id;
    if (!buyerId) {
      const { data: newProfile } = await supabase.from("profiles").insert({ wallet_address: buyer_wallet }).select("id").single();
      buyerId = newProfile?.id;
    }
    
    const { data: snippet } = await supabase.from("snippets").select("*").eq("id", snippet_id).single();
    if (!snippet) return c.json({ success: false, error: "Snippet not found" }, 404);
    
    const { data: payment, error } = await supabase.from("payments").insert({ snippet_id, buyer_id: buyerId, buyer_wallet, amount_cents: snippet.price_cents, tx_hash }).select().single();
    if (error) throw error;
    
    const newReadCount = snippet.read_count + 1;
    await supabase.from("snippets").update({ read_count: newReadCount }).eq("id", snippet_id);
    
    if (newReadCount >= 10) {
      const { data: existingSub } = await supabase.from("subscriptions").select("*").eq("user_id", buyerId).eq("snippet_id", snippet_id).single();
      if (!existingSub) await supabase.from("subscriptions").insert({ user_id: buyerId, snippet_id, is_active: true });
    }
    
    return c.json({ success: true, data: { payment, snippet, subscription_eligible: newReadCount >= 10 } });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 400);
  }
});

app.get("/payments/check/:snippet_id/:wallet", async (c) => {
  const { data: profile } = await supabase.from("profiles").select("id").eq("wallet_address", c.req.param("wallet")).single();
  if (!profile) return c.json({ success: true, has_access: false });
  
  const { data: payment } = await supabase.from("payments").select("*").eq("snippet_id", c.req.param("snippet_id")).eq("buyer_id", profile.id).single();
  const { data: subscription } = await supabase.from("subscriptions").select("*").eq("snippet_id", c.req.param("snippet_id")).eq("user_id", profile.id).eq("is_active", true).single();
  
  return c.json({ success: true, has_access: !!(payment || subscription), has_subscription: !!subscription });
});

// Verification - Requires real transaction hash from frontend
app.post("/verify/:id", async (c) => {
  try {
    const { data: snippet } = await supabase.from("snippets").select("*").eq("id", c.req.param("id")).single();
    if (!snippet) return c.json({ success: false, error: "Snippet not found" }, 404);
    
    const body = await c.req.json();
    const { tx_hash } = body;
    
    // Require real transaction hash from client
    if (!tx_hash || !tx_hash.match(/^0x[0-9a-fA-F]{64}$/)) {
      return c.json({ 
        success: false, 
        error: "Real transaction hash required. Please submit a Monad blockchain transaction first.",
        required_format: "0x + 64 hex characters (66 total)"
      }, 400);
    }
    
    // Verify transaction exists on Monad blockchain
    let blockNumber;
    try {
      const tx = await monadProvider.getTransaction(tx_hash);
      if (!tx) {
        return c.json({ success: false, error: "Transaction not found on Monad blockchain" }, 400);
      }
      blockNumber = tx.blockNumber || await monadProvider.getBlockNumber();
    } catch (err) {
      return c.json({ success: false, error: `Failed to verify transaction on Monad: ${err.message}` }, 400);
    }
    
    const { data, error } = await supabase.from("snippets").update({ 
      verification_status: "verified", 
      verification_tx_hash: tx_hash, 
      verification_timestamp: new Date().toISOString() 
    }).eq("id", c.req.param("id")).select().single();
    
    if (error) throw error;
    
    await supabase.from("verification_logs").insert({ 
      snippet_id: c.req.param("id"), 
      tx_hash, 
      block_number: blockNumber, 
      verification_result: "success", 
      gas_used: 21000 
    });
    
    return c.json({ success: true, data: { snippet: data, tx_hash, block_number: blockNumber } });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 400);
  }
});

app.get("/verify/:id/status", async (c) => {
  const { data, error } = await supabase.from("snippets").select("verification_status, verification_tx_hash, verification_timestamp").eq("id", c.req.param("id")).single();
  if (error) return c.json({ success: false, error: error.message }, 404);
  return c.json({ success: true, data });
});

// AI Auto-Fix
app.post("/autofix/:id", async (c) => {
  try {
    const { data: snippet } = await supabase.from("snippets").select("*").eq("id", c.req.param("id")).single();
    if (!snippet) return c.json({ success: false, error: "Snippet not found" }, 404);
    
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You are a code auto-fix engine. Fix deprecated APIs, framework updates, security issues, and best practices. Return ONLY the fixed code." },
        { role: "user", content: `Language: ${snippet.language}\nFramework: ${snippet.framework || "none"}\n\nCode:\n${snippet.code}` }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 2048
    });
    
    const fixedCode = completion.choices[0]?.message?.content || snippet.code;
    const { data, error } = await supabase.from("snippets").update({ code: fixedCode, last_auto_fix: new Date().toISOString(), auto_fix_count: snippet.auto_fix_count + 1 }).eq("id", c.req.param("id")).select().single();
    if (error) throw error;
    
    await supabase.from("auto_fix_logs").insert({ snippet_id: c.req.param("id"), original_code: snippet.code, fixed_code: fixedCode, fix_reason: "Weekly auto-fix scan", groq_model: "llama-3.3-70b-versatile" });
    
    return c.json({ success: true, data: { snippet: data, changes_made: fixedCode !== snippet.code } });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 400);
  }
});

app.post("/autofix/batch", async (c) => {
  const { data: snippets } = await supabase.from("snippets").select("id").eq("is_active", true);
  const results = [];
  for (const snippet of snippets || []) {
    try {
      const response = await fetch(`${c.req.url.split("/autofix")[0]}/autofix/${snippet.id}`, { method: "POST" });
      results.push({ id: snippet.id, ...(await response.json()) });
    } catch (err) {
      results.push({ id: snippet.id, success: false, error: err.message });
    }
  }
  return c.json({ success: true, data: { total: snippets?.length || 0, processed: results.length, results } });
});

// Analytics
app.get("/stats", async (c) => {
  const { count: totalSnippets } = await supabase.from("snippets").select("*", { count: "exact", head: true }).eq("is_active", true);
  const { count: totalPayments } = await supabase.from("payments").select("*", { count: "exact", head: true });
  const { count: totalVerifications } = await supabase.from("verification_logs").select("*", { count: "exact", head: true });
  const { count: totalAutoFixes } = await supabase.from("auto_fix_logs").select("*", { count: "exact", head: true });
  return c.json({ success: true, data: { total_snippets: totalSnippets || 0, total_payments: totalPayments || 0, total_verifications: totalVerifications || 0, total_auto_fixes: totalAutoFixes || 0 } });
});

app.get("/stats/user/:wallet", async (c) => {
  const { data: profile } = await supabase.from("profiles").select("id").eq("wallet_address", c.req.param("wallet")).single();
  if (!profile) return c.json({ success: true, data: { snippets: 0, purchases: 0, subscriptions: 0 } });
  
  const { count: snippets } = await supabase.from("snippets").select("*", { count: "exact", head: true }).eq("author_id", profile.id);
  const { count: purchases } = await supabase.from("payments").select("*", { count: "exact", head: true }).eq("buyer_id", profile.id);
  const { count: subscriptions } = await supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("user_id", profile.id).eq("is_active", true);
  
  return c.json({ success: true, data: { snippets: snippets || 0, purchases: purchases || 0, subscriptions: subscriptions || 0 } });
});

Deno.serve(app.fetch);
