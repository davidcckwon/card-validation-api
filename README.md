# Card Validation API

A minimal REST API that validates credit card numbers using the Luhn algorithm and detects card schemes (Visa, Mastercard, Amex, Discover).

## Description

This is a **barebones, simple API implementation** designed to satisfy the requirements with emphasis on **quick readability**. The code prioritizes clarity and simplicity over advanced features.

**Production Considerations:**  
To deploy this in production, you would need to consider additional aspects such as:
- Authentication & authorization
- Rate limiting
- Load balancing
- Database for analytics/logging
- Perhaps serverless (Lambda) instead of EC2
- HTTPS/TLS certificates
- Monitoring & alerting
- CI/CD pipeline

However, for **simplicity and to adhere to the requirements while keeping this quick and readable**, this implementation focuses on the core functionality.

---

## API Endpoints

### POST /validate
Validates a credit card number using the Luhn algorithm.

**Request:**
```json
{
  "number": "4111111111111111"
}
```

**Response (200 OK):**
```json
{
  "valid": true,
  "scheme": "visa",
  "message": "OK"
}
```

**Error (400 Bad Request):**
```json
{
  "error": "Card number is invalid (Luhn check failed)"
}
```

**Supported formats:**
- `4111111111111111`
- `4111-1111-1111-1111`
- `4111 1111 1111 1111`

### GET /health
Health check endpoint.

**Response (200 OK):**
```json
{
  "status": "ok"
}
```

---

## Quick Start

### Prerequisites

- **Node.js 20+** (or Docker)
- **pnpm** (optional, can use npm)

### Set Up Server Locally

#### Option 1: Without Docker

```bash
# Install dependencies
pnpm install

# Build TypeScript
pnpm build

# Start server
pnpm run dev
```

Server runs at **http://localhost:3000**

#### Option 2: With Docker

```bash
# Build Docker image
docker build -t card-validation-api .

# Run container
docker run -p 3000:3000 card-validation-api
```

Server runs at **http://localhost:3000**

---

## In the Cloud

### Deploy to AWS EC2

**Prerequisites:**
- AWS Account
- AWS CLI configured (`aws configure`)
- AWS CDK CLI (`npm install -g aws-cdk`)

**Steps:**

1. **Bootstrap CDK (one-time setup):**
```bash
cdk bootstrap
```

2. **Update your GitHub repository URL in `lib/stack.ts` (line 81)**

3. **Deploy:**
```bash
pnpm build
cdk deploy --context stage=dev
```

4. **Test the deployed API:**
```bash
# CDK outputs the EC2 public IP
curl -X POST http://<EC2_PUBLIC_IP>:3000/validate \
  -H "Content-Type: application/json" \
  -d '{"number":"4111111111111111"}'
```

5. **Cleanup:**
```bash
cdk destroy --context stage=dev
```

---

## Tests

Run all tests:
```bash
pnpm test
```

**Test coverage:**
- Luhn algorithm validation (valid/invalid cards)
- Card scheme detection (Visa, Mastercard, Amex, Discover)
- Input sanitization (spaces, dashes, non-digits)
- Length validation (12-19 digits)
- API responses (200 & 400 status codes)
- Health endpoint

**Test results:**
```
Test Suites: 2 passed, 2 total
Tests:       16 passed, 16 total
```

---

## Postman Collection

Import this collection to test against your running server:

```json
{
  "info": {
    "name": "Card Validation API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Validate Card - Valid Visa",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\"number\":\"4111111111111111\"}"
        },
        "url": {
          "raw": "http://localhost:3000/validate",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["validate"]
        }
      }
    },
    {
      "name": "Validate Card - With Spaces",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\"number\":\"4111 1111 1111 1111\"}"
        },
        "url": {
          "raw": "http://localhost:3000/validate",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["validate"]
        }
      }
    },
    {
      "name": "Validate Card - Invalid Luhn",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\"number\":\"4111111111111112\"}"
        },
        "url": {
          "raw": "http://localhost:3000/validate",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["validate"]
        }
      }
    },
    {
      "name": "Validate Card - Mastercard",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\"number\":\"5500000000000004\"}"
        },
        "url": {
          "raw": "http://localhost:3000/validate",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["validate"]
        }
      }
    },
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": {
          "raw": "http://localhost:3000/health",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["health"]
        }
      }
    }
  ]
}
```

Save this as `postman_collection.json` and import into Postman, or use curl:

```bash
# Valid card
curl -X POST http://localhost:3000/validate \
  -H "Content-Type: application/json" \
  -d '{"number":"4111111111111111"}'

# Invalid card (Luhn check fails)
curl -X POST http://localhost:3000/validate \
  -H "Content-Type: application/json" \
  -d '{"number":"4111111111111112"}'

# Health check
curl http://localhost:3000/health
```

---

## Implementation Details

### Luhn Algorithm
Self-implemented (no external validator library):
1. Strip spaces/dashes from input
2. Starting from rightmost digit, double every second digit
3. If doubled value ≥ 10, subtract 9
4. Sum all digits
5. Valid if sum % 10 == 0

**Code:** `src/routes/validate.ts` (lines 87-112)

### Card Scheme Detection
Uses BIN (Bank Identification Number) prefix patterns:
- **Visa:** starts with 4
- **Mastercard:** 51-55 or 2221-2720
- **Amex:** 34 or 37
- **Discover:** 6011, 65, or 622126-622925

**Code:** `src/routes/validate.ts` (lines 121-135)

### Security & Compliance
- No card numbers are logged (PCI DSS compliant)
- Input sanitization strips spaces/dashes and validates format
- Only accepts 12-19 digits after cleanup
- Proper error handling without exposing sensitive data

---

## Project Structure

```
src/
├── app.ts              # Express server setup
├── routes/
│   ├── health.ts       # GET /health endpoint
│   └── validate.ts     # POST /validate + Luhn algorithm
└── utils/
    └── logger.ts       # Structured JSON logging

lib/
├── stack.ts            # AWS CDK infrastructure (EC2, VPC)
└── env.ts              # Environment configuration

test/
├── health.test.ts      # Health endpoint tests
└── validate.test.ts    # Card validation + Luhn tests
```

---

## Environment Variables

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode (development/production)

Example:
```bash
PORT=8000 pnpm run dev
```
