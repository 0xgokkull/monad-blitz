const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log(
    "\n╔═══════════════════════════════════════════════════════════╗"
  );
  console.log("║   X402Facilitator Contract Interaction                   ║");
  console.log(
    "╚═══════════════════════════════════════════════════════════╝\n"
  );

  // Load deployment info
  const deploymentFile = path.join(
    __dirname,
    "..",
    "deployments",
    `${hre.network.name}-deployment.json`
  );

  if (!fs.existsSync(deploymentFile)) {
    console.log("❌ Deployment file not found!");
    console.log(
      "💡 Run: npx hardhat run scripts/deploy.js --network monadTestnet\n"
    );
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  const contractAddress = deployment.contractAddress;

  console.log("📝 Contract Address:", contractAddress);

  // Get contract instance
  const X402Facilitator = await hre.ethers.getContractFactory(
    "X402Facilitator"
  );
  const facilitator = X402Facilitator.attach(contractAddress);

  // Get signer
  const [signer] = await hre.ethers.getSigners();
  console.log("👤 Signer:", signer.address);

  // Get contract info
  console.log("\n📊 Contract Status:");
  const owner = await facilitator.owner();
  const paymentAmount = await facilitator.PAYMENT_AMOUNT();
  const commissionRate = await facilitator.commissionRate();
  const commissionPool = await facilitator.getCommissionPool();
  const balance = await facilitator.getBalance();

  console.log("   Owner:", owner);
  console.log(
    "   Payment Amount:",
    hre.ethers.formatEther(paymentAmount),
    "ETH"
  );
  console.log("   Commission Rate:", commissionRate.toString() + "%");
  console.log(
    "   Commission Pool:",
    hre.ethers.formatEther(commissionPool),
    "ETH"
  );
  console.log("   Contract Balance:", hre.ethers.formatEther(balance), "ETH");

  // Example: Pay for snippet
  console.log("\n💳 Example: Pay for Snippet");
  const snippetId = hre.ethers.id("test-snippet-1"); // Generate snippet ID
  console.log("   Snippet ID:", snippetId);

  // Check if already paid
  const hasAccess = await facilitator.hasAccess(signer.address, snippetId);
  console.log("   Has Access:", hasAccess);

  if (!hasAccess) {
    console.log("\n   Sending payment...");
    try {
      const tx = await facilitator.payForSnippet(snippetId, {
        value: paymentAmount,
      });
      console.log("   Transaction sent:", tx.hash);

      const receipt = await tx.wait();
      console.log("   ✅ Payment confirmed in block:", receipt.blockNumber);

      // Check access again
      const newAccess = await facilitator.hasAccess(signer.address, snippetId);
      console.log("   Has Access Now:", newAccess);
    } catch (error) {
      console.log("   ❌ Payment failed:", error.message);
    }
  } else {
    console.log("   ℹ️  Already purchased this snippet");
  }

  // Get updated stats
  console.log("\n📊 Updated Stats:");
  const newCommissionPool = await facilitator.getCommissionPool();
  const newBalance = await facilitator.getBalance();
  const userPayments = await facilitator.getUserPayments(signer.address);

  console.log(
    "   Commission Pool:",
    hre.ethers.formatEther(newCommissionPool),
    "ETH"
  );
  console.log(
    "   Contract Balance:",
    hre.ethers.formatEther(newBalance),
    "ETH"
  );
  console.log(
    "   Your Total Payments:",
    hre.ethers.formatEther(userPayments),
    "ETH"
  );

  console.log("\n✅ Interaction Complete!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
