# Credit Card Validator API

A simple web API built with Node.js and TypeScript that validates credit card numbers using the Luhn algorithm.

- `GET /health` - Health check endpoint
- `POST /validate` - Validates credit card numbers using the Luhn algorithm and detects card schemes

## Stack

- **Runtime:** Node.js v20
- **Language:** TypeScript 5.x
- **Framework:** Express 4.x
- **Testing:** Jest 29.x with Supertest
- **Logging:** Winston (structured JSON)
- **Infrastructure:** AWS CDK 2.x
- **Deployment:** Docker on EC2

## Project Structure

```
src/
├── app.ts              # Express server setup
├── routes/
│   ├── health.ts       # GET /health endpoint
│   └── validate.ts     # POST /validate + Luhn algorithm
└── utils/
    ├── logger.ts       # Structured JSON logging (silent in tests)
    └── mask.ts         # Card number masking utility

bin/
├── app.ts              # CDK app entry point
├── stack.ts            # AWS CDK infrastructure (EC2, VPC, IAM)
└── env.ts              # Environment configuration

test/
├── health.test.ts      # Health endpoint tests
└── validate.test.ts    # Card validation + Luhn tests (18 tests)
```

## API Reference

### GET /health

Health check endpoint.

**Request:**

```bash
curl http://localhost:3000/health
```

**Response (200 OK):**

```json
{
  "status": "ok"
}
```

---

### POST /validate

Validates a credit card number using the Luhn algorithm and identifies the card scheme.

**Request Body:**

| Field  | Type   | Required | Description                                              |
| ------ | ------ | -------- | -------------------------------------------------------- |
| number | string | Yes      | Credit card number (12-19 digits, spaces/dashes allowed) |

**Request:**

```bash
curl -X POST http://localhost:3000/validate \
     -H "Content-Type: application/json" \
     -d '{"number": "4111 1111 1111 1111"}'
```

**Success Response (200 OK):**

```json
{
  "valid": true,
  "scheme": "visa",
  "message": "OK"
}
```

**Response Fields:**

| Field   | Type    | Description                                                 |
| ------- | ------- | ----------------------------------------------------------- |
| valid   | boolean | Whether the card number passes Luhn validation              |
| scheme  | string  | Card scheme (visa, mastercard, amex, discover) or "unknown" |
| message | string  | Human-readable status message                               |

**Error Response (400 Bad Request):**

```json
{
  "valid": false,
  "scheme": "visa",
  "message": "Luhn algorithm check failed."
}
```

For invalid input:

```json
{
  "error": "Card number must contain 12 to 19 digits."
}
```

### Running Test Suite

```bash
pnpm test
```

## Security

**PAN (Primary Account Number) Protection:**

- All card numbers are masked in logs (only last 4 digits visible)
- Masking applied via `maskCardNumber()` from `utils/mask.ts` before logging

Example log output:

```json
{
  "level": "info",
  "message": "Processing card validation request.",
  "number": "XXXXXXXXXXXX1111",
  "timestamp": "2025-11-06T16:00:00.000Z"
}
```

## Running the Server Locally

### Requirements

- Node.js v20 or higher
- Docker (installed and running)
- pnpm (package manager)

### Commands

**Install dependencies:**

```bash
pnpm install
```

**Run the server (Docker):**

```bash
pnpm run dev
```

This starts the container on port 3000.

**Stop the server (Docker):**

```bash
pnpm run dev:stop
```

> Once running, the API will be available at `http://localhost:3000`

## Deploying to AWS

### Requirements

- AWS CLI (configured with valid credentials)
- AWS CDK CLI (install: `pnpm install -g aws-cdk`)

### Deploy

```bash
pnpm run deploy
```

The deployment process:

1. Synthesizes CloudFormation template
2. Builds Docker image locally
3. Pushes image to ECR
4. Creates VPC, security group, IAM role
5. Launches EC2 instance with user data script
6. Automatically pulls and runs the container

> **Note:** This deployment demonstrates the core functionality. Production-ready
> infrastructure would require CI/CD pipelines, monitoring, secrets management, and
> architectural decisions for scaling and cost optimization (e.g., Lambda vs EC2).

### Clean Up

To remove all deployed resources and avoid ongoing charges:

```bash
cdk destroy
```
