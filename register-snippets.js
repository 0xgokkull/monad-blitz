require("dotenv").config();
const { ethers } = require("hardhat");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CONTRACT_ADDRESS = process.env.X402_CONTRACT_ADDRESS;
const CONTRACT_ABI = [
  "function registerSnippet(bytes32 snippetId, address creator) external",
  "function snippetCreators(bytes32 snippetId) external view returns (address)",
  "function owner() external view returns (address)",
];

// Convert UUID to bytes32
function uuidToBytes32(uuid) {
  const truncated = uuid.substring(0, 31);
  return ethers.encodeBytes32String(truncated);
}

async function main() {
  console.log("\n🔧 Registering Snippets with Creators\n");
  console.log("━".repeat(60));

  // Get signer
  const [signer] = await ethers.getSigners();
  console.log("📝 Signer:", signer.address);

  // Get contract
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  const owner = await contract.owner();
  console.log("📝 Contract Owner:", owner);
  console.log("📝 Contract:", CONTRACT_ADDRESS);
  console.log("━".repeat(60) + "\n");

  // Get all snippets from database
  const { data: snippets, error } = await supabase
    .from("snippets")
    .select("id, title, author_id, profiles:author_id(wallet_address)")
    .eq("is_active", true);

  if (error) throw error;

  console.log(`📦 Found ${snippets.length} snippets\n`);

  let registered = 0;
  let skipped = 0;
  let failed = 0;

  for (const snippet of snippets) {
    try {
      const snippetIdBytes32 = uuidToBytes32(snippet.id);

      // Check if already registered
      const existingCreator = await contract.snippetCreators(snippetIdBytes32);

      if (existingCreator !== ethers.ZeroAddress) {
        console.log(`⏭️  ${snippet.title}`);
        console.log(`   Already registered to: ${existingCreator}`);
        skipped++;
        continue;
      }

      // Get creator address (use owner if no author)
      const creatorAddress = snippet.profiles?.wallet_address || owner;

      console.log(`📝 Registering: ${snippet.title}`);
      console.log(`   Creator: ${creatorAddress}`);

      // Register snippet
      const tx = await contract.registerSnippet(
        snippetIdBytes32,
        creatorAddress
      );
      await tx.wait();

      console.log(`   ✅ Registered! TX: ${tx.hash.slice(0, 20)}...`);
      registered++;

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      failed++;
    }
    console.log();
  }

  console.log("━".repeat(60));
  console.log("📊 Summary:");
  console.log(`   ✅ Registered: ${registered}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📦 Total: ${snippets.length}`);
  console.log("━".repeat(60));
  console.log("\n✅ Registration complete!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
