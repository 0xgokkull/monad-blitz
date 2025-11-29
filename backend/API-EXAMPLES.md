# Monad x402 Marketplace API - Request/Response Examples

**Base URL:** `https://hnydbhyuifpxtigeodvi.supabase.co/functions/v1/api`

All requests require Authorization header:

```
Authorization: Bearer YOUR_SUPABASE_ANON_KEY
```

---

## 1. Health Check

**Endpoint:** `GET /health`

**Request:**

```bash
curl https://hnydbhyuifpxtigeodvi.supabase.co/functions/v1/api/health \
  -H "Authorization: Bearer YOUR_KEY"
```

**Response:**

```json
{
  "success": true,
  "status": "ok",
  "timestamp": "2025-11-29T05:37:05.097Z"
}
```

---

## 2. Create Snippet

**Endpoint:** `POST /snippets`

**Request Body:**

```json
{
  "title": "useSWR Hook - React Data Fetching",
  "description": "Production-ready SWR hook for React with TypeScript",
  "code": "import useSWR from 'swr';\n\nexport function useUser(id: string) {\n  const { data, error, isLoading } = useSWR(\n    `/api/users/${id}`,\n    fetcher\n  );\n  \n  return {\n    user: data,\n    isLoading,\n    isError: error\n  };\n}",
  "language": "typescript",
  "framework": "react",
  "tags": ["react", "hooks", "swr", "data-fetching"],
  "author_wallet": "0x6b015df62da64a12df2e13d2ffab9bfd99a838a2"
}
```

**cURL:**

```bash
curl -X POST https://hnydbhyuifpxtigeodvi.supabase.co/functions/v1/api/snippets \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "useSWR Hook",
    "description": "Production-ready SWR hook",
    "code": "import useSWR from '\''swr'\''...",
    "language": "typescript",
    "framework": "react",
    "tags": ["react", "hooks"],
    "author_wallet": "0x6b015df62da64a12df2e13d2ffab9bfd99a838a2"
  }'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "6c548591-af9f-4839-9a02-32cda07655ed",
    "title": "useSWR Hook - React Data Fetching",
    "description": "Production-ready SWR hook for React with TypeScript",
    "code": "import useSWR from 'swr'...",
    "language": "typescript",
    "framework": "react",
    "tags": ["react", "hooks", "swr", "data-fetching"],
    "author_id": null,
    "price_cents": 1,
    "read_count": 0,
    "verification_status": "pending",
    "verification_tx_hash": null,
    "verification_timestamp": null,
    "last_auto_fix": null,
    "auto_fix_count": 0,
    "is_active": true,
    "created_at": "2025-11-29T05:37:06.47897+00:00",
    "updated_at": "2025-11-29T05:37:06.47897+00:00"
  }
}
```

---

## 3. Get All Snippets

**Endpoint:** `GET /snippets`

**Request:**

```bash
curl https://hnydbhyuifpxtigeodvi.supabase.co/functions/v1/api/snippets \
  -H "Authorization: Bearer YOUR_KEY"
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "6c548591-af9f-4839-9a02-32cda07655ed",
      "title": "useSWR Hook - React Data Fetching",
      "description": "Production-ready SWR hook for React with TypeScript",
      "code": "import useSWR from 'swr'...",
      "language": "typescript",
      "framework": "react",
      "tags": ["react", "hooks", "swr", "data-fetching"],
      "author_id": null,
      "price_cents": 1,
      "read_count": 0,
      "verification_status": "pending",
      "is_active": true,
      "created_at": "2025-11-29T05:37:06.47897+00:00",
      "profiles": null
    }
  ]
}
```

---

## 4. Get Snippet by ID

**Endpoint:** `GET /snippets/:id`

**Request:**

```bash
curl https://hnydbhyuifpxtigeodvi.supabase.co/functions/v1/api/snippets/6c548591-af9f-4839-9a02-32cda07655ed \
  -H "Authorization: Bearer YOUR_KEY"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "6c548591-af9f-4839-9a02-32cda07655ed",
    "title": "useSWR Hook - React Data Fetching",
    "description": "Production-ready SWR hook for React with TypeScript",
    "code": "import useSWR from 'swr'...",
    "language": "typescript",
    "framework": "react",
    "tags": ["react", "hooks", "swr", "data-fetching"],
    "verification_status": "pending",
    "profiles": null
  }
}
```

---

## 5. Verify Snippet on Monad Blockchain

**Endpoint:** `POST /verify/:id`

**Request:**

```bash
curl -X POST https://hnydbhyuifpxtigeodvi.supabase.co/functions/v1/api/verify/6c548591-af9f-4839-9a02-32cda07655ed \
  -H "Authorization: Bearer YOUR_KEY"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "snippet": {
      "id": "6c548591-af9f-4839-9a02-32cda07655ed",
      "title": "useSWR Hook - React Data Fetching",
      "verification_status": "verified",
      "verification_tx_hash": "0x9a66b0987086e31611e05e9731",
      "verification_timestamp": "2025-11-29T05:37:10.662+00:00"
    },
    "tx_hash": "0x9a66b0987086e31611e05e9731",
    "block_number": 52509161
  }
}
```

---

## 6. Get Verification Status

**Endpoint:** `GET /verify/:id/status`

**Request:**

```bash
curl https://hnydbhyuifpxtigeodvi.supabase.co/functions/v1/api/verify/6c548591-af9f-4839-9a02-32cda07655ed/status \
  -H "Authorization: Bearer YOUR_KEY"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "verification_status": "verified",
    "verification_tx_hash": "0x9a66b0987086e31611e05e9731",
    "verification_timestamp": "2025-11-29T05:37:10.662+00:00"
  }
}
```

---

## 7. Process Payment (x402)

**Endpoint:** `POST /payments/process`

**Request Body:**

```json
{
  "snippet_id": "6c548591-af9f-4839-9a02-32cda07655ed",
  "buyer_wallet": "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",
  "tx_hash": "0x9a66b0987086e31611e05e9731"
}
```

**cURL:**

```bash
curl -X POST https://hnydbhyuifpxtigeodvi.supabase.co/functions/v1/api/payments/process \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "snippet_id": "6c548591-af9f-4839-9a02-32cda07655ed",
    "buyer_wallet": "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",
    "tx_hash": "0x9a66b0987086e31611e05e9731"
  }'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "payment": {
      "id": "28ab5cbc-6e06-429f-9c51-05ea8d13de06",
      "snippet_id": "6c548591-af9f-4839-9a02-32cda07655ed",
      "buyer_id": null,
      "buyer_wallet": "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",
      "amount_cents": 1,
      "tx_hash": "0x9a66b0987086e31611e05e9731",
      "payment_type": "one-time",
      "created_at": "2025-11-29T05:37:15.070093+00:00"
    },
    "snippet": {
      "id": "6c548591-af9f-4839-9a02-32cda07655ed",
      "title": "useSWR Hook - React Data Fetching",
      "price_cents": 1,
      "read_count": 0
    },
    "subscription_eligible": false
  }
}
```

---

## 8. Check Payment Status

**Endpoint:** `GET /payments/check/:snippet_id/:wallet`

**Request:**

```bash
curl https://hnydbhyuifpxtigeodvi.supabase.co/functions/v1/api/payments/check/6c548591-af9f-4839-9a02-32cda07655ed/0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199 \
  -H "Authorization: Bearer YOUR_KEY"
```

**Response:**

```json
{
  "success": true,
  "has_access": true,
  "has_subscription": false
}
```

---

## 9. AI Auto-Fix Snippet

**Endpoint:** `POST /autofix/:id`

**Request:**

```bash
curl -X POST https://hnydbhyuifpxtigeodvi.supabase.co/functions/v1/api/autofix/6c548591-af9f-4839-9a02-32cda07655ed \
  -H "Authorization: Bearer YOUR_KEY"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "snippet": {
      "id": "6c548591-af9f-4839-9a02-32cda07655ed",
      "title": "useSWR Hook - React Data Fetching",
      "code": "// Fixed code with improvements...",
      "last_auto_fix": "2025-11-29T05:37:17.997+00:00",
      "auto_fix_count": 1
    },
    "changes_made": true
  }
}
```

---

## 10. Batch Auto-Fix All Snippets

**Endpoint:** `POST /autofix/batch`

**Request:**

```bash
curl -X POST https://hnydbhyuifpxtigeodvi.supabase.co/functions/v1/api/autofix/batch \
  -H "Authorization: Bearer YOUR_KEY"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "total": 5,
    "processed": 5,
    "results": [
      {
        "id": "6c548591-af9f-4839-9a02-32cda07655ed",
        "success": true,
        "data": {
          "changes_made": true
        }
      }
    ]
  }
}
```

---

## 11. Get Marketplace Statistics

**Endpoint:** `GET /stats`

**Request:**

```bash
curl https://hnydbhyuifpxtigeodvi.supabase.co/functions/v1/api/stats \
  -H "Authorization: Bearer YOUR_KEY"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "total_snippets": 5,
    "total_payments": 2,
    "total_verifications": 3,
    "total_auto_fixes": 2
  }
}
```

---

## 12. Get User Statistics

**Endpoint:** `GET /stats/user/:wallet`

**Request:**

```bash
curl https://hnydbhyuifpxtigeodvi.supabase.co/functions/v1/api/stats/user/0x6b015df62da64a12df2e13d2ffab9bfd99a838a2 \
  -H "Authorization: Bearer YOUR_KEY"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "snippets": 3,
    "purchases": 5,
    "subscriptions": 1
  }
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

**Common HTTP Status Codes:**

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

## Authentication

All requests require the Supabase anon key in the Authorization header:

```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Get your key from: `.env` → `SUPABASE_ANON_KEY`

---

## Rate Limits

- **Free Tier**: Unlimited requests
- **Groq AI**: 30 requests/minute (free tier)
- **Monad RPC**: No limit on testnet

---

## Test Results Summary

✅ **12/12 Tests Passing**

- Health Check ✅
- Create Snippet ✅
- Get All Snippets ✅
- Get Snippet by ID ✅
- Verify Snippet ✅
- Get Verification Status ✅
- Process Payment ✅
- Check Payment Status ✅
- Auto-Fix Snippet ✅
- Batch Auto-Fix ✅
- Get Marketplace Stats ✅
- Get User Stats ✅

**Last Test Run:** 2025-11-29T05:37:22Z
**API Status:** 🟢 Operational
