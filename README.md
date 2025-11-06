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

> Tests run in < 0.5s with silent logging (no console output during tests)

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

### Deployment Process (Detailed)

**1. Local Build Phase**

```bash
pnpm run build
```

- TypeScript compiler (`tsc`) compiles all `.ts` files to JavaScript in `dist/` folder
- Compiles: `bin/app.ts`, `bin/stack.ts`, `bin/env.ts`, and `src/` files

**2. CDK Synth Phase**

```bash
cdk deploy
```

- CDK loads `bin/app.ts` (entry point defined in `cdk.json`)
- Calls `getEnvironmentConfig()` from `bin/env.ts`:
  - `serviceName: 'card-validator-api'`
  - `port: 3000`
  - `instanceClass: 'T3'`
  - `instanceSize: 'MICRO'`
- Creates `CardValidatorApiStack` with these props
- Synthesizes CloudFormation template to `cdk.out/`

**3. Docker Image Build**

- CDK reads your `Dockerfile`
- Builds Docker image locally with platform `linux/amd64`
- Creates ECR repository in your AWS account (if doesn't exist)
- Authenticates to ECR using AWS credentials
- Pushes Docker image to ECR
- Image URI: `<account-id>.dkr.ecr.<region>.amazonaws.com/<repo-name>:<hash>`

**4. CloudFormation Stack Creation**

CDK deploys CloudFormation stack with these resources:

**a. VPC & Networking:**

- Creates VPC with 2 availability zones
- Creates 2 public subnets (one per AZ)
- Creates Internet Gateway
- Creates route tables for public subnets
- No NAT gateways (cost optimization)

**b. IAM Role:**

- Creates `card-validator-apiInstanceRole`
- Attaches `AmazonSSMManagedInstanceCore` managed policy (for Session Manager)
- Grants ECR pull permissions for the pushed image
- Creates instance profile

**c. Security Group:**

- Creates `card-validator-apiSecurityGroup`
- Adds ingress rule: Allow TCP port 3000 from `0.0.0.0/0`
- Adds egress rule: Allow all outbound traffic

**d. EC2 Instance:**

- Launches t3.micro instance in public subnet
- Uses ECS-optimized Amazon Linux 2023 AMI (has Docker pre-installed)
- Assigns public IP address
- Attaches IAM role and security group
- Injects UserData script (bash):

```bash
#!/bin/bash
# Add ec2-user to docker group
usermod -aG docker ec2-user

# ECR login
aws ecr get-login-password --region <region> | \
  docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com

# Stop and remove old container if exists
docker stop card-validator-api || true
docker rm card-validator-api || true

# Pull new image from ECR
docker pull <ecr-image-uri>

# Run container
docker run -d \
  --name card-validator-api \
  -p 3000:3000 \
  --restart unless-stopped \
  <ecr-image-uri>
```

**5. Instance Initialization**

- EC2 instance boots
- UserData script executes automatically
- Docker pulls image from ECR
- Container starts and listens on port 3000
- Health check: `http://<public-ip>:3000/health`

**6. Stack Outputs**

CDK displays:

- `Ec2InstanceId` - EC2 instance ID
- `Ec2PublicIp` - EC2 public IP address
- `ApiEndpoint` - API endpoint URL

### Clean Up

To remove all deployed resources and avoid ongoing charges:

```bash
cdk destroy
```
