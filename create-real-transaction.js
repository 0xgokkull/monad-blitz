#!/usr/bin/env node

/**
 * Create Real Monad Transaction for Testing
 *
 * This script helps you create a REAL transaction on Monad testnet
 * that can be used for testing the verification and payment endpoints.
 */

import { ethers } from "ethers";
import { config } from "dotenv";
config();

const MONAD_RPC_URL =
  process.env.MONAD_RPC_URL || "https://testnet-rpc.monad.xyz";
const MONAD_CHAIN_ID = parseInt(process.env.MONAD_CHAIN_ID || "10143");

console.log("\n╔═══════════════════════════════════════════════════════════╗");
console.log("║   Create Real Monad Transaction for Testing              ║");
console.log("╚═══════════════════════════════════════════════════════════╝\n");

console.log("📋 Instructions:");
console.log("1. You need a wallet with Monad testnet tokens");
console.log("2. Get testnet tokens from Monad faucet");
console.log("3. Set your private key in environment or provide it here\n");

console.log(
  "⚠️  IMPORTANT: This will create a REAL transaction on Monad testnet\n"
);

// Check if we can connect to Monad
async function checkMonadConnection() {
  try {
    const provider = new ethers.JsonRpcProvider(MONAD_RPC_URL);
    const blockNumber = await provider.getBlockNumber();
    console.log("✅ Connected to Monad testnet");
    console.log(`   Current block: ${blockNumber}`);
    console.log(`   RPC URL: ${MONAD_RPC_URL}`);
    console.log(`   Chain ID: ${MONAD_CHAIN_ID}\n`);
    return provider;
  } catch (error) {
    console.error("❌ Failed to connect to Monad testnet:", error.message);
    console.log("\n💡 Make sure Monad testnet RPC is accessible");
    process.exit(1);
  }
}

// Get recent transaction as example
async function getRecentTransaction(provider) {
  try {
    const blockNumber = await provider.getBlockNumber();
    const block = await provider.getBlock(blockNumber);

    if (block && block.transactions && block.transactions.length > 0) {
      const txHash = block.transactions[0];
      const tx = await provider.getTransaction(txHash);

      console.log("📝 Example of a real Monad transaction:");
      console.log(`   TX Hash: ${txHash}`);
      console.log(`   Block: ${tx.blockNumber}`);
      console.log(`   From: ${tx.from}`);
      console.log(`   To: ${tx.to || "Contract Creation"}`);
      console.log(`   Value: ${ethers.formatEther(tx.value)} ETH\n`);

      return txHash;
    }
  } catch (error) {
    console.log("⚠️  Could not fetch recent transactions:", error.message);
  }
  return null;
}

// Main function
async function main() {
  const provider = await checkMonadConnection();
  const exampleTx = await getRecentTransaction(provider);

  console.log("═══════════════════════════════════════════════════════════\n");
  console.log("🔧 How to create a real transaction:\n");

  console.log("Option 1: Using MetaMask or Web3 Wallet");
  console.log("  1. Add Monad testnet to your wallet:");
  console.log(`     - Network Name: Monad Testnet`);
  console.log(`     - RPC URL: ${MONAD_RPC_URL}`);
  console.log(`     - Chain ID: ${MONAD_CHAIN_ID}`);
  console.log(`     - Currency: MON`);
  console.log("  2. Get testnet tokens from Monad faucet");
  console.log("  3. Send a small transaction (0.001 MON)");
  console.log("  4. Copy the transaction hash\n");

  console.log("Option 2: Using ethers.js (Programmatic)");
  console.log("  ```javascript");
  console.log("  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);");
  console.log("  const tx = await wallet.sendTransaction({");
  console.log('    to: "0x6b015df62da64a12df2e13d2ffab9bfd99a838a2",');
  console.log('    value: ethers.parseEther("0.001")');
  console.log("  });");
  console.log("  await tx.wait();");
  console.log('  console.log("TX Hash:", tx.hash);');
  console.log("  ```\n");

  console.log("Option 3: Use an existing transaction");
  if (exampleTx) {
    console.log(`  You can use this recent transaction for testing:`);
    console.log(`  ${exampleTx}\n`);
  }

  console.log("═══════════════════════════════════════════════════════════\n");
  console.log("📝 Once you have a real transaction hash:\n");
  console.log("Test Verification:");
  console.log(
    "  curl -X POST https://hnydbhyuifpxtigeodvi.supabase.co/functions/v1/api/verify/SNIPPET_ID \\"
  );
  console.log('    -H "Authorization: Bearer YOUR_KEY" \\');
  console.log('    -H "Content-Type: application/json" \\');
  console.log('    -d \'{"tx_hash": "0x...YOUR_REAL_TX_HASH..."}\'\n');

  console.log("Test Payment:");
  console.log(
    "  curl -X POST https://hnydbhyuifpxtigeodvi.supabase.co/functions/v1/api/payments/process \\"
  );
  console.log('    -H "Authorization: Bearer YOUR_KEY" \\');
  console.log('    -H "Content-Type: application/json" \\');
  console.log("    -d '{");
  console.log('      "snippet_id": "SNIPPET_ID",');
  console.log(
    '      "buyer_wallet": "0x6b015df62da64a12df2e13d2ffab9bfd99a838a2",'
  );
  console.log('      "tx_hash": "0x...YOUR_REAL_TX_HASH..."');
  console.log("    }'\n");

  console.log("═══════════════════════════════════════════════════════════\n");
}

main().catch(console.error);
