#!/bin/bash

# Monad x402 Marketplace - cURL API Test Suite
# Run: chmod +x test-curl.sh && ./test-curl.sh

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

API_BASE="${API_BASE_URL:-http://localhost:54321/functions/v1/api}"
TEST_WALLET="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
TEST_WALLET_2="0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   Monad x402 Marketplace - cURL API Test Suite           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Test counter
PASS=0
FAIL=0

# Test function
test_api() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    
    echo -e "\n${BLUE}Testing: ${name}${NC}"
    echo "Endpoint: ${method} ${endpoint}"
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X ${method} "${API_BASE}${endpoint}" \
            -H "Content-Type: application/json")
    else
        response=$(curl -s -w "\n%{http_code}" -X ${method} "${API_BASE}${endpoint}" \
            -H "Content-Type: application/json" \
            -d "${data}")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✓ PASS (HTTP ${http_code})${NC}"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
        PASS=$((PASS + 1))
        echo "$body"
    else
        echo -e "${RED}✗ FAIL (HTTP ${http_code})${NC}"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
        FAIL=$((FAIL + 1))
        echo ""
    fi
}

# Store variables
SNIPPET_ID=""
TX_HASH=""

# Test 1: Health Check
test_api "Health Check" "GET" "/health"

# Test 2: Create Snippet
echo -e "\n${YELLOW}Creating test snippet...${NC}"
response=$(test_api "Create Snippet" "POST" "/snippets" '{
  "title": "useSWR Hook - React Data Fetching",
  "description": "Production-ready SWR hook for React with TypeScript",
  "code": "import useSWR from '\''swr'\'';\n\nexport function useUser(id: string) {\n  const { data, error, isLoading } = useSWR(\n    `/api/users/${id}`,\n    fetcher\n  );\n  \n  return {\n    user: data,\n    isLoading,\n    isError: error\n  };\n}",
  "language": "typescript",
  "framework": "react",
  "tags": ["react", "hooks", "swr", "data-fetching"],
  "author_wallet": "'"${TEST_WALLET}"'"
}')

SNIPPET_ID=$(echo "$response" | jq -r '.data.id' 2>/dev/null)
echo -e "${GREEN}Created Snippet ID: ${SNIPPET_ID}${NC}"

# Test 3: Get All Snippets
test_api "Get All Snippets" "GET" "/snippets"

# Test 4: Get Snippet by ID
if [ ! -z "$SNIPPET_ID" ] && [ "$SNIPPET_ID" != "null" ]; then
    test_api "Get Snippet by ID" "GET" "/snippets/${SNIPPET_ID}"
fi

# Test 5: Verify Snippet on Monad
if [ ! -z "$SNIPPET_ID" ] && [ "$SNIPPET_ID" != "null" ]; then
    echo -e "\n${YELLOW}Verifying snippet on Monad blockchain...${NC}"
    response=$(test_api "Verify Snippet" "POST" "/verify/${SNIPPET_ID}")
    TX_HASH=$(echo "$response" | jq -r '.data.tx_hash' 2>/dev/null)
    echo -e "${GREEN}Verification TX Hash: ${TX_HASH}${NC}"
fi

# Test 6: Get Verification Status
if [ ! -z "$SNIPPET_ID" ] && [ "$SNIPPET_ID" != "null" ]; then
    test_api "Get Verification Status" "GET" "/verify/${SNIPPET_ID}/status"
fi

# Test 7: Process Payment (x402)
if [ ! -z "$SNIPPET_ID" ] && [ "$SNIPPET_ID" != "null" ] && [ ! -z "$TX_HASH" ] && [ "$TX_HASH" != "null" ]; then
    echo -e "\n${YELLOW}Processing x402 payment...${NC}"
    test_api "Process Payment" "POST" "/payments/process" '{
      "snippet_id": "'"${SNIPPET_ID}"'",
      "buyer_wallet": "'"${TEST_WALLET_2}"'",
      "tx_hash": "'"${TX_HASH}"'"
    }'
fi

# Test 8: Check Payment Status
if [ ! -z "$SNIPPET_ID" ] && [ "$SNIPPET_ID" != "null" ]; then
    test_api "Check Payment Status" "GET" "/payments/check/${SNIPPET_ID}/${TEST_WALLET_2}"
fi

# Test 9: Auto-Fix Snippet with Groq AI
if [ ! -z "$SNIPPET_ID" ] && [ "$SNIPPET_ID" != "null" ]; then
    echo -e "\n${YELLOW}Running Groq AI auto-fix...${NC}"
    test_api "Auto-Fix Snippet" "POST" "/autofix/${SNIPPET_ID}"
fi

# Test 10: Get Marketplace Stats
test_api "Get Marketplace Stats" "GET" "/stats"

# Test 11: Get User Stats
test_api "Get User Stats" "GET" "/stats/user/${TEST_WALLET}"

# Test 12: Create Second Snippet
echo -e "\n${YELLOW}Creating second test snippet...${NC}"
test_api "Create Second Snippet" "POST" "/snippets" '{
  "title": "useDebounce Hook",
  "description": "Debounce hook for React with TypeScript",
  "code": "import { useEffect, useState } from '\''react'\'';\n\nexport function useDebounce<T>(value: T, delay: number): T {\n  const [debouncedValue, setDebouncedValue] = useState<T>(value);\n\n  useEffect(() => {\n    const handler = setTimeout(() => {\n      setDebouncedValue(value);\n    }, delay);\n\n    return () => clearTimeout(handler);\n  }, [value, delay]);\n\n  return debouncedValue;\n}",
  "language": "typescript",
  "framework": "react",
  "tags": ["react", "hooks", "debounce", "performance"],
  "author_wallet": "'"${TEST_WALLET}"'"
}'

# Summary
echo -e "\n${YELLOW}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   Test Suite Complete!                                    ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${GREEN}Passed: ${PASS}${NC}"
echo -e "${RED}Failed: ${FAIL}${NC}"
echo ""
echo -e "${BLUE}Test Data:${NC}"
echo "- Snippet ID: ${SNIPPET_ID}"
echo "- TX Hash: ${TX_HASH}"
echo "- Test Wallet: ${TEST_WALLET}"
echo "- Buyer Wallet: ${TEST_WALLET_2}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Check Supabase dashboard for data"
echo "2. Verify transactions on Monad testnet explorer"
echo "3. Review auto-fix logs in database"
echo "4. Set up weekly cron for batch auto-fix"
