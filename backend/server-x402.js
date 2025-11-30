require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createThirdwebClient } = require("thirdweb");
const { facilitator, settlePayment } = require("thirdweb/x402");
const { defineChain } = require("thirdweb/chains");
const { createClient } = require("@supabase/supabase-js");
const { ethers } = require("ethers");

const app = express();
app.use(express.json());

// CORS configuration for development and production
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    if (
      allowedOrigins.indexOf(origin) !== -1 ||
      process.env.NODE_ENV !== "production"
    ) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Monad Testnet configuration
const monadTestnet = defineChain(10143);

// Thirdweb client
// Thirdweb client
const secretKey = process.env.THIRDWEB_SECRET_KEY;
const clientId = process.env.THIRDWEB_CLIENT_ID;

if (!secretKey && !clientId) {
  console.error("❌ ERROR: Missing THIRDWEB_SECRET_KEY or THIRDWEB_CLIENT_ID in environment variables.");
  console.error("   Please add one of these to your .env file or deployment settings.");
  process.exit(1);
}

const client = createThirdwebClient({
  secretKey: secretKey,
  clientId: clientId,
});

// X402 Facilitator
const twFacilitator = facilitator({
  client,
  serverWalletAddress: process.env.RECIPIENT_WALLET,
});

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Ethers provider for blockchain verification
const provider = new ethers.JsonRpcProvider(process.env.MONAD_RPC_URL);

// Contract ABI (only the functions we need)
const CONTRACT_ABI = [
  "function hasAccess(address user, bytes32 snippetId) external view returns (bool)",
  "function payForSnippet(bytes32 snippetId) external payable",
  "function PAYMENT_AMOUNT() external view returns (uint256)",
  "function registerSnippet(bytes32 snippetId, address creator) external",
  "function snippetCreators(bytes32 snippetId) external view returns (address)",
];

const contract = new ethers.Contract(
  process.env.X402_CONTRACT_ADDRESS,
  CONTRACT_ABI,
  provider
);

console.log("🚀 Monad x402 Server Starting...");
console.log("📝 Recipient Wallet:", process.env.RECIPIENT_WALLET);
console.log("📝 Contract Address:", process.env.X402_CONTRACT_ADDRESS);
console.log("⛓️  Network: Monad Testnet (Chain ID: 10143)");
console.log("💰 Payment Token: ETH (0.01 per snippet)");

// ==================== SNIPPET ROUTES WITH X402 ====================

// Helper: Convert UUID to bytes32
function uuidToBytes32(uuid) {
  // Take first 31 chars and encode as bytes32 (same as ethers.encodeBytes32String)
  const truncated = uuid.substring(0, 31);
  return ethers.encodeBytes32String(truncated);
}

// Helper: Verify on-chain payment
async function verifyOnChainPayment(userAddress, snippetId) {
  try {
    const snippetIdBytes32 = uuidToBytes32(snippetId);
    const hasAccess = await contract.hasAccess(userAddress, snippetIdBytes32);
    return hasAccess;
  } catch (error) {
    console.error("Blockchain verification error:", error);
    return false;
  }
}

// Get snippet with x402 payment OR blockchain verification
app.get("/api/snippets/:id", async (req, res) => {
  try {
    const snippetId = req.params.id;
    const userWallet = req.query.wallet || req.headers["x-wallet"];

    // Method 1: Check blockchain for on-chain payment
    if (userWallet) {
      console.log(`🔍 Checking blockchain access for ${userWallet}...`);
      const hasAccess = await verifyOnChainPayment(userWallet, snippetId);

      if (hasAccess) {
        console.log("✅ On-chain access verified!");

        // Fetch snippet from database
        const { data: snippet, error } = await supabase
          .from("snippets")
          .select("*")
          .eq("id", snippetId)
          .single();

        if (error) throw error;

        // Record access in database (if not already recorded)
        const { data: existingPayment } = await supabase
          .from("payments")
          .select("id")
          .eq("snippet_id", snippetId)
          .eq("buyer_wallet", userWallet.toLowerCase())
          .single();

        if (!existingPayment) {
          await supabase.from("payments").insert({
            snippet_id: snippetId,
            buyer_wallet: userWallet.toLowerCase(),
            amount_cents: 1,
            tx_hash: "on-chain-verified",
            payment_type: "blockchain-verified",
          });
        }

        // Increment read count
        await supabase
          .from("snippets")
          .update({ read_count: (snippet.read_count || 0) + 1 })
          .eq("id", snippetId);

        return res.json({
          success: true,
          message: "Access verified on-chain! ⚡",
          verification: "blockchain",
          snippet: snippet,
        });
      }
    }

    // Method 2: Try Thirdweb x402 payment
    const result = await settlePayment({
      resourceUrl: `http://localhost:3000/api/snippets/${snippetId}`,
      method: "GET",
      paymentData: req.headers["x-payment"],
      network: monadTestnet,
      price: "$0.01",
      payTo: process.env.RECIPIENT_WALLET,
      facilitator: twFacilitator,
    });

    if (result.status === 200) {
      // Payment successful - fetch snippet from database
      const { data: snippet, error } = await supabase
        .from("snippets")
        .select("*")
        .eq("id", snippetId)
        .single();

      if (error) throw error;

      // Record payment in database
      await supabase.from("payments").insert({
        snippet_id: snippetId,
        buyer_wallet: req.headers["x-payment-wallet"] || "unknown",
        amount_cents: 1,
        tx_hash: result.transactionHash,
        payment_type: "x402-thirdweb",
      });

      // Increment read count
      await supabase
        .from("snippets")
        .update({ read_count: (snippet.read_count || 0) + 1 })
        .eq("id", snippetId);

      res.json({
        success: true,
        message: "Payment successful! ⚡",
        verification: "thirdweb-x402",
        tx: result.transactionHash,
        snippet: snippet,
      });
    } else {
      // Payment required - return 402
      res
        .status(result.status)
        .set(result.responseHeaders || {})
        .json(result.responseBody);
    }
  } catch (e) {
    console.error("Error:", e);
    res.status(500).json({ error: "Server error", details: e.message });
  }
});

// Get all snippets (free - no payment required)
app.get("/api/snippets", async (req, res) => {
  try {
    const { data: snippets, error } = await supabase
      .from("snippets")
      .select(
        "id, title, description, language, framework, tags, verification_status, created_at, last_auto_fix, auto_fix_count"
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({ success: true, data: snippets });
  } catch (e) {
    console.error("Error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

// Create new snippet
app.post("/api/snippets", async (req, res) => {
  try {
    const {
      title,
      description,
      code,
      language,
      framework,
      tags,
      author_wallet,
    } = req.body;

    // Validate required fields
    if (!title || !description || !code || !language) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: title, description, code, language",
      });
    }

    if (!author_wallet) {
      return res.status(400).json({
        success: false,
        error: "Author wallet address is required",
      });
    }

    console.log(`📤 Creating snippet: ${title} by ${author_wallet}`);

    // Create snippet without profile (author_id can be null)
    const { data: snippet, error } = await supabase
      .from("snippets")
      .insert({
        title,
        description,
        code,
        language,
        framework: framework || null,
        tags: tags || [],
        author_id: null, // Not using profiles
        price_cents: 1,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ Snippet created: ${snippet.id}`);

    res.status(201).json({
      success: true,
      data: snippet,
      message: "Snippet created successfully",
    });
  } catch (e) {
    console.error("Error creating snippet:", e);
    res.status(500).json({
      success: false,
      error: "Failed to create snippet",
      details: e.message,
    });
  }
});

// Verify snippet (requires payment)
app.post("/api/verify/:id", async (req, res) => {
  try {
    const snippetId = req.params.id;

    // Settle payment
    const result = await settlePayment({
      resourceUrl: `http://localhost:3000/api/verify/${snippetId}`,
      method: "POST",
      paymentData: req.headers["x-payment"],
      network: monadTestnet,
      price: "$0.01",
      payTo: process.env.RECIPIENT_WALLET,
      facilitator: twFacilitator,
    });

    if (result.status === 200) {
      // Payment successful - verify snippet
      const { data: snippet } = await supabase
        .from("snippets")
        .update({
          verification_status: "verified",
          verification_tx_hash: result.transactionHash,
          verification_timestamp: new Date().toISOString(),
        })
        .eq("id", snippetId)
        .select()
        .single();

      res.json({
        success: true,
        message: "Snippet verified! ⚡",
        tx: result.transactionHash,
        snippet: snippet,
      });
    } else {
      res
        .status(result.status)
        .set(result.responseHeaders || {})
        .json(result.responseBody);
    }
  } catch (e) {
    console.error("Error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

// Health check (free)
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    network: "Monad Testnet",
    x402: "enabled",
    timestamp: new Date().toISOString(),
  });
});

// Stats (free)
app.get("/api/stats", async (req, res) => {
  try {
    const { count: totalSnippets } = await supabase
      .from("snippets")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    const { count: totalPayments } = await supabase
      .from("payments")
      .select("*", { count: "exact", head: true });

    res.json({
      success: true,
      data: {
        total_snippets: totalSnippets || 0,
        total_payments: totalPayments || 0,
      },
    });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// Register snippet on blockchain (admin only)
app.post("/api/register-snippet", async (req, res) => {
  try {
    const { snippet_id, creator_address } = req.body;

    if (!snippet_id || !creator_address) {
      return res.status(400).json({
        success: false,
        error: "Missing snippet_id or creator_address",
      });
    }

    console.log(`🔗 Registering snippet ${snippet_id} for ${creator_address}`);

    // Get signer (must be contract owner)
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const contractWithSigner = contract.connect(wallet);

    // Convert UUID to bytes32
    function uuidToBytes32(uuid) {
      const truncated = uuid.substring(0, 31);
      return ethers.encodeBytes32String(truncated);
    }

    const snippetIdBytes32 = uuidToBytes32(snippet_id);

    // Check if already registered
    const existingCreator = await contractWithSigner.snippetCreators(
      snippetIdBytes32
    );

    if (existingCreator !== ethers.ZeroAddress) {
      console.log(`⏭️  Already registered to: ${existingCreator}`);
      return res.json({
        success: true,
        message: "Already registered",
        creator: existingCreator,
      });
    }

    // Register snippet
    const tx = await contractWithSigner.registerSnippet(
      snippetIdBytes32,
      creator_address
    );
    await tx.wait();

    console.log(`✅ Registered! TX: ${tx.hash}`);

    res.json({
      success: true,
      message: "Snippet registered on blockchain",
      tx_hash: tx.hash,
      creator: creator_address,
    });
  } catch (e) {
    console.error("Registration error:", e);
    res.status(500).json({
      success: false,
      error: "Failed to register on blockchain",
      details: e.message,
    });
  }
});

// AI Auto-Fix with Groq
app.post("/api/autofix/:id", async (req, res) => {
  try {
    const snippetId = req.params.id;

    // Fetch snippet
    const { data: snippet, error: fetchError } = await supabase
      .from("snippets")
      .select("*")
      .eq("id", snippetId)
      .single();

    if (fetchError || !snippet) {
      return res
        .status(404)
        .json({ success: false, error: "Snippet not found" });
    }

    console.log(`🤖 Auto-fixing snippet: ${snippet.title}`);

    // Call Groq AI for auto-fix
    const Groq = require("groq-sdk");
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a code auto-fix engine. Fix deprecated APIs, framework updates, security issues, and best practices. Return ONLY the fixed code without explanations.",
        },
        {
          role: "user",
          content: `Language: ${snippet.language}\nFramework: ${snippet.framework || "none"
            }\n\nCode:\n${snippet.code}`,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 2048,
    });

    const fixedCode = completion.choices[0]?.message?.content || snippet.code;
    const changesMade = fixedCode !== snippet.code;

    // Update snippet with fixed code
    const { data: updatedSnippet, error: updateError } = await supabase
      .from("snippets")
      .update({
        code: fixedCode,
        last_auto_fix: new Date().toISOString(),
        auto_fix_count: (snippet.auto_fix_count || 0) + 1,
      })
      .eq("id", snippetId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log the auto-fix
    await supabase.from("auto_fix_logs").insert({
      snippet_id: snippetId,
      original_code: snippet.code,
      fixed_code: fixedCode,
      fix_reason: "Manual auto-fix request",
      groq_model: "llama-3.3-70b-versatile",
    });

    console.log(`✅ Auto-fix complete. Changes made: ${changesMade}`);

    res.json({
      success: true,
      data: {
        snippet: updatedSnippet,
        changes_made: changesMade,
        original_length: snippet.code.length,
        fixed_length: fixedCode.length,
      },
    });
  } catch (e) {
    console.error("Auto-fix error:", e);
    res.status(500).json({ success: false, error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n✅ Server live → http://localhost:${PORT}`);
  console.log(`\n📋 Endpoints:`);
  console.log(`   GET  /health - Health check`);
  console.log(`   GET  /api/snippets - List all snippets (free)`);
  console.log(`   GET  /api/snippets/:id - Get snippet (x402 payment)`);
  console.log(`   POST /api/verify/:id - Verify snippet (x402 payment)`);
  console.log(`   GET  /api/stats - Get stats (free)`);
  console.log(`\n💡 Test with: node client-x402.js\n`);
});
