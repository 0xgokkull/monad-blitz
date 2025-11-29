const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log(
    "\n╔═══════════════════════════════════════════════════════════╗"
  );
  console.log("║   Deploying X402Facilitator to Monad Testnet             ║");
  console.log(
    "╚═══════════════════════════════════════════════════════════╝\n"
  );

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  if (balance === 0n) {
    console.log("❌ Error: Insufficient balance!");
    console.log("💡 Get testnet tokens from Monad faucet\n");
    process.exit(1);
  }

  // Deploy X402Facilitator
  console.log("🚀 Deploying X402Facilitator contract...");
  const X402Facilitator = await hre.ethers.getContractFactory(
    "X402Facilitator"
  );
  const facilitator = await X402Facilitator.deploy();

  await facilitator.waitForDeployment();
  const facilitatorAddress = await facilitator.getAddress();

  console.log("✅ X402Facilitator deployed to:", facilitatorAddress);

  // Get contract details
  const owner = await facilitator.owner();
  const paymentAmount = await facilitator.PAYMENT_AMOUNT();
  const commissionRate = await facilitator.commissionRate();

  console.log("\n📋 Contract Details:");
  console.log("   Owner:", owner);
  console.log(
    "   Payment Amount:",
    hre.ethers.formatEther(paymentAmount),
    "ETH"
  );
  console.log("   Commission Rate:", commissionRate.toString() + "%");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: facilitatorAddress,
    owner: owner,
    paymentAmount: paymentAmount.toString(),
    commissionRate: commissionRate.toString(),
    deployedAt: new Date().toISOString(),
    transactionHash: facilitator.deploymentTransaction().hash,
    blockNumber: facilitator.deploymentTransaction().blockNumber,
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(
    deploymentsDir,
    `${hre.network.name}-deployment.json`
  );
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

  console.log("\n💾 Deployment info saved to:", deploymentFile);

  // Update .env file
  const envPath = path.join(__dirname, "..", ".env");
  let envContent = fs.readFileSync(envPath, "utf8");

  if (envContent.includes("X402_CONTRACT_ADDRESS=")) {
    envContent = envContent.replace(
      /X402_CONTRACT_ADDRESS=.*/,
      `X402_CONTRACT_ADDRESS=${facilitatorAddress}`
    );
  } else {
    envContent += `\n# X402 Contract\nX402_CONTRACT_ADDRESS=${facilitatorAddress}\n`;
  }

  fs.writeFileSync(envPath, envContent);
  console.log("✅ Updated .env with contract address\n");

  console.log("╔═══════════════════════════════════════════════════════════╗");
  console.log("║   Deployment Complete!                                    ║");
  console.log(
    "╚═══════════════════════════════════════════════════════════╝\n"
  );

  console.log("📝 Next Steps:");
  console.log("1. Verify contract on explorer (optional)");
  console.log("2. Test payment functionality");
  console.log("3. Update frontend with contract address");
  console.log("4. Fund contract for gas fees if needed\n");

  console.log("🔗 Contract Address:", facilitatorAddress);
  console.log(
    "🔗 Explorer:",
    `https://testnet-explorer.monad.xyz/address/${facilitatorAddress}\n`
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
