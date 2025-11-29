require("dotenv").config();
const { createThirdwebClient } = require("thirdweb");
const { wrapFetchWithPayment } = require("thirdweb/x402");
const { createWallet, injectedProvider } = require("thirdweb/wallets");

// Thirdweb client (using client ID for frontend)
const client = createThirdwebClient({
  clientId: process.env.THIRDWEB_CLIENT_ID,
});

async function testX402Payment() {
  console.log(
    "\n╔═══════════════════════════════════════════════════════════╗"
  );
  console.log("║   Testing Monad x402 with Thirdweb                       ║");
  console.log(
    "╚═══════════════════════════════════════════════════════════╝\n"
  );

  try {
    // Create wallet (MetaMask or other injected wallet)
    console.log("📝 Step 1: Connecting wallet...");
    const wallet = createWallet("io.metamask");

    await wallet.connect({ client });
    const account = wallet.getAccount();
    console.log("✅ Wallet connected:", account.address);

    // Wrap fetch with payment capability
    console.log("\n📝 Step 2: Wrapping fetch with x402 payment...");
    const fetchWithPayment = wrapFetchWithPayment(fetch, client, wallet);

    // Test 1: Get all snippets (free)
    console.log("\n📝 Step 3: Fetching all snippets (free)...");
    const listRes = await fetch("http://localhost:3000/api/snippets");
    const listData = await listRes.json();
    console.log("✅ Found", listData.data?.length || 0, "snippets");

    if (listData.data && listData.data.length > 0) {
      const snippetId = listData.data[0].id;
      console.log("📝 Testing with snippet:", snippetId);

      // Test 2: Get snippet with payment
      console.log("\n📝 Step 4: Fetching snippet with x402 payment...");
      console.log("💰 Price: $0.01 USDC");
      console.log("⚡ Network: Monad Testnet (zero gas!)");

      const snippetRes = await fetchWithPayment(
        `http://localhost:3000/api/snippets/${snippetId}`
      );
      const snippetData = await snippetRes.json();

      if (snippetData.success) {
        console.log("\n✅ PAYMENT SUCCESSFUL! 🎉");
        console.log("   Transaction:", snippetData.tx);
        console.log("   Snippet:", snippetData.snippet.title);
        console.log("\n💡 Monad is blazing fast ⚡");
      } else {
        console.log("\n❌ Payment failed:", snippetData);
      }
    } else {
      console.log("\n⚠️  No snippets found. Create some first!");
    }

    console.log(
      "\n╔═══════════════════════════════════════════════════════════╗"
    );
    console.log(
      "║   Test Complete!                                          ║"
    );
    console.log(
      "╚═══════════════════════════════════════════════════════════╝\n"
    );
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error("\n💡 Make sure:");
    console.log("   1. Server is running: node server-x402.js");
    console.log("   2. MetaMask is installed and connected");
    console.log("   3. You have USDC on Monad testnet");
    console.log("   4. Thirdweb keys are in .env\n");
  }
}

// Run test
testX402Payment();
