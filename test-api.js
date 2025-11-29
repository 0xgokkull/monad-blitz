#!/usr/bin/env node

/**
 * Monad x402 Marketplace API Test Suite
 * Run: node test-api.js
 */

import { config } from "dotenv";
config();

const API_BASE =
  process.env.API_BASE_URL || "http://localhost:54321/functions/v1/api";
const TEST_WALLET =
  process.env.X402_FACILITATOR_ADDRESS ||
  "0x6b015df62da64a12df2e13d2ffab9bfd99a838a2";
const TEST_WALLET_2 = "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199";

let createdSnippetId = null;
let mockTxHash = null;

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

async function testAPI(name, method, endpoint, body = null) {
  try {
    console.log(`\n${colors.blue}Testing: ${name}${colors.reset}`);

    const options = {
      method,
      headers: { "Content-Type": "application/json" },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.json();

    if (response.ok && data.success) {
      console.log(`${colors.green}✓ PASS${colors.reset}`);
      console.log("Response:", JSON.stringify(data, null, 2));
      return data;
    } else {
      console.log(`${colors.red}✗ FAIL${colors.reset}`);
      console.log("Response:", JSON.stringify(data, null, 2));
      return null;
    }
  } catch (error) {
    console.log(`${colors.red}✗ ERROR: ${error.message}${colors.reset}`);
    return null;
  }
}

async function runTests() {
  console.log(`${colors.yellow}
╔═══════════════════════════════════════════════════════════╗
║   Monad x402 Marketplace API Test Suite                  ║
║   Testing all endpoints...                                ║
╚═══════════════════════════════════════════════════════════╝
${colors.reset}`);

  // 1. Health Check
  await testAPI("Health Check", "GET", "/health");

  // 2. Create Snippet
  const createResult = await testAPI("Create Snippet", "POST", "/snippets", {
    title: "useSWR Hook - React Data Fetching",
    description: "Production-ready SWR hook for React with TypeScript",
    code: `import useSWR from 'swr';

export function useUser(id: string) {
  const { data, error, isLoading } = useSWR(
    \`/api/users/\${id}\`,
    fetcher
  );
  
  return {
    user: data,
    isLoading,
    isError: error
  };
}`,
    language: "typescript",
    framework: "react",
    tags: ["react", "hooks", "swr", "data-fetching"],
    author_wallet: TEST_WALLET,
  });

  if (createResult?.data?.id) {
    createdSnippetId = createResult.data.id;
  }

  // 3. Get All Snippets
  await testAPI("Get All Snippets", "GET", "/snippets");

  // 4. Get Snippet by ID
  if (createdSnippetId) {
    await testAPI("Get Snippet by ID", "GET", `/snippets/${createdSnippetId}`);
  }

  // 5. Verify Snippet on Monad
  if (createdSnippetId) {
    const verifyResult = await testAPI(
      "Verify Snippet",
      "POST",
      `/verify/${createdSnippetId}`
    );
    if (verifyResult?.data?.tx_hash) {
      mockTxHash = verifyResult.data.tx_hash;
    }
  }

  // 6. Get Verification Status
  if (createdSnippetId) {
    await testAPI(
      "Get Verification Status",
      "GET",
      `/verify/${createdSnippetId}/status`
    );
  }

  // 7. Process Payment (x402)
  if (createdSnippetId && mockTxHash) {
    await testAPI("Process Payment", "POST", "/payments/process", {
      snippet_id: createdSnippetId,
      buyer_wallet: TEST_WALLET_2,
      tx_hash: mockTxHash,
    });
  }

  // 8. Check Payment Status
  if (createdSnippetId) {
    await testAPI(
      "Check Payment Status",
      "GET",
      `/payments/check/${createdSnippetId}/${TEST_WALLET_2}`
    );
  }

  // 9. Auto-Fix Snippet with Groq AI
  if (createdSnippetId) {
    await testAPI("Auto-Fix Snippet", "POST", `/autofix/${createdSnippetId}`);
  }

  // 10. Get Marketplace Stats
  await testAPI("Get Marketplace Stats", "GET", "/stats");

  // 11. Get User Stats
  await testAPI("Get User Stats", "GET", `/stats/user/${TEST_WALLET}`);

  // 12. Create Another Snippet for Batch Testing
  const createResult2 = await testAPI(
    "Create Second Snippet",
    "POST",
    "/snippets",
    {
      title: "useDebounce Hook",
      description: "Debounce hook for React",
      code: `import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}`,
      language: "typescript",
      framework: "react",
      tags: ["react", "hooks", "debounce"],
      author_wallet: TEST_WALLET,
    }
  );

  console.log(`\n${colors.yellow}
╔═══════════════════════════════════════════════════════════╗
║   Test Suite Complete!                                    ║
╚═══════════════════════════════════════════════════════════╝
${colors.reset}`);

  console.log(`\n${colors.green}Summary:${colors.reset}`);
  console.log(`- Created Snippet ID: ${createdSnippetId}`);
  console.log(`- Mock TX Hash: ${mockTxHash}`);
  console.log(`- Test Wallet: ${TEST_WALLET}`);
  console.log(`- Buyer Wallet: ${TEST_WALLET_2}`);

  console.log(`\n${colors.blue}Next Steps:${colors.reset}`);
  console.log("1. Set up Supabase project and add credentials to .env");
  console.log("2. Run migrations: supabase db push");
  console.log("3. Deploy edge function: supabase functions deploy api");
  console.log("4. Update API_BASE_URL in .env to your deployed function URL");
  console.log("5. Run this test again: node test-api.js");
}

runTests().catch(console.error);
