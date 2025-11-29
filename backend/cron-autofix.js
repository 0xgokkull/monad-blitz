require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const Groq = require("groq-sdk");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function weeklyAutoFix() {
  console.log("\n🤖 Starting Weekly AI Auto-Fix...");
  console.log("⏰ Time:", new Date().toLocaleString());
  console.log("━".repeat(60));

  try {
    // Get all active snippets
    const { data: snippets, error } = await supabase
      .from("snippets")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    console.log(`\n📦 Found ${snippets.length} snippets to review\n`);

    let fixed = 0;
    let unchanged = 0;
    let failed = 0;

    for (const snippet of snippets) {
      try {
        console.log(`🔍 Reviewing: ${snippet.title}`);

        // Call Groq AI for auto-fix
        const completion = await groq.chat.completions.create({
          messages: [
            {
              role: "system",
              content:
                "You are a code auto-fix engine. Fix deprecated APIs, framework updates, security issues, and best practices. Return ONLY the fixed code without explanations or markdown formatting.",
            },
            {
              role: "user",
              content: `Language: ${snippet.language}\nFramework: ${
                snippet.framework || "none"
              }\n\nCode:\n${snippet.code}`,
            },
          ],
          model: "llama-3.3-70b-versatile",
          temperature: 0.3,
          max_tokens: 2048,
        });

        const fixedCode =
          completion.choices[0]?.message?.content || snippet.code;
        const changesMade = fixedCode !== snippet.code;

        if (changesMade) {
          // Update snippet with fixed code
          const { error: updateError } = await supabase
            .from("snippets")
            .update({
              code: fixedCode,
              last_auto_fix: new Date().toISOString(),
              auto_fix_count: (snippet.auto_fix_count || 0) + 1,
            })
            .eq("id", snippet.id);

          if (updateError) throw updateError;

          // Log the auto-fix
          await supabase.from("auto_fix_logs").insert({
            snippet_id: snippet.id,
            original_code: snippet.code,
            fixed_code: fixedCode,
            fix_reason: "Weekly automated review",
            groq_model: "llama-3.3-70b-versatile",
          });

          console.log(
            `   ✅ Fixed (${snippet.code.length} → ${fixedCode.length} chars)`
          );
          fixed++;
        } else {
          console.log(`   ✓ No changes needed`);
          unchanged++;
        }

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        failed++;
      }
    }

    console.log("\n" + "━".repeat(60));
    console.log("📊 Summary:");
    console.log(`   ✅ Fixed: ${fixed}`);
    console.log(`   ✓ Unchanged: ${unchanged}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📦 Total: ${snippets.length}`);
    console.log("━".repeat(60));
    console.log("✅ Weekly auto-fix complete!\n");
  } catch (error) {
    console.error("\n❌ Fatal error:", error.message);
    process.exit(1);
  }
}

// Run immediately if called directly
if (require.main === module) {
  weeklyAutoFix()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { weeklyAutoFix };
