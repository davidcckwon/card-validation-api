# Credit Card Validator API

This project contains a small web API built with Node.js and TypeScript that validates credit card numbers using the Luhn algorithm.

## Requirements

The API implements the following logic:

* **Luhn Check:** Implements the algorithm manually.
* **Input Handling:** Strips spaces and dashes, accepts 12 to 19 digits.
* **Card Scheme Detection:** Identifies schemes (Visa, Mastercard, Amex, Discover) based on prefixes.
* **Security:** Card numbers are masked (all but last 4 digits) before being logged.

## 🏃 How to Run Locally

You must have Node.js and pnpm installed.

1. **Install Dependencies:**

```bash
   pnpm install
```

2. **Build the TypeScript code:**

```bash
pnpm run build
   ```

3. **Run the API:**

```bash
   pnpm run start

   # The API will start on http://localhost:3000
```

### Example Usage (with cURL)

**Success (Valid Visa):**

```bash
curl -X POST http://localhost:3000/validate \
     -H "Content-Type: application/json" \
     -d '{ "number": "4111 1111 1111 1111" }'
# Expected: {"valid":true,"scheme":"visa","message":"OK"}
```

**Health Check:**

```bash
curl http://localhost:3000/health
# Expected: {"status":"ok"}
```

## 🧪 How to Run Tests

The project uses Jest for testing.

**Run All Tests:**

```bash
pnpm run test
```

**Run in Watch Mode:**

```bash
pnpm run test:watch
```

## 🚀 How to Deploy to AWS EC2

The application is deployed using AWS CDK (Cloud Development Kit) and a self-contained Docker image running on a single EC2 instance.

### Prerequisites

* AWS CLI configured with credentials.
* AWS CDK CLI installed (`pnpm install -g aws-cdk`).
* Docker installed and running locally (for building the image).

### Deployment Steps (Using CDK and Docker)

1. **Initialize CDK Environment (if necessary):**

```bash
   cdk bootstrap aws://ACCOUNT-ID/REGION
```

2. **Build and Deploy:**

   The stack will provision a VPC, Security Group, IAM Role, and a single EC2 instance which will install Docker, build the image, and run the container via UserData.

```bash
   pnpm run deploy
   ```

3. **Find the API Endpoint:**

   After deployment, the API URL will be printed in the console output:

   ```
   Outputs:
   CardValidatorApiStack.ApiEndpoint = http://[EC2 Public IP]:[Port]
   ```

4. **Clean Up:**

   To remove all deployed resources:

```bash
   cdk destroy
   ```

## Project Structure

```
src/
├── app.ts              # Express server setup
├── routes/
│   ├── health.ts       # GET /health endpoint
│   └── validate.ts     # POST /validate + Luhn algorithm
└── utils/
    ├── logger.ts       # Structured JSON logging (Winston)
    └── mask.ts         # Card number masking utility

lib/
├── stack.ts            # AWS CDK infrastructure (EC2, VPC, IAM)
└── env.ts              # Environment configuration

bin/
└── app.ts              # CDK app entry point

test/
├── health.test.ts      # Health endpoint tests
└── validate.test.ts    # Card validation + Luhn tests
```

## Implementation Details

### Luhn Algorithm

Self-implemented (no external validator library):
1. Strip spaces/dashes from input
2. Starting from rightmost digit, double every second digit
3. If doubled value ≥ 10, subtract 9
4. Sum all digits
5. Valid if sum % 10 == 0

**Code:** `src/routes/validate.ts`

### Card Scheme Detection

Uses BIN (Bank Identification Number) prefix patterns:
* **Visa:** starts with 4
* **Mastercard:** 51-55 or 2221-2720
* **Amex:** 34 or 37
* **Discover:** 6011, 65, or 622126-622925

**Code:** `src/routes/validate.ts`

### Security & Compliance

* Card numbers are masked (all but last 4 digits) before logging
* Input sanitization strips spaces/dashes and validates format
* Only accepts 12-19 digits after cleanup
* Proper error handling without exposing sensitive data

**Code:** `src/utils/mask.ts`
