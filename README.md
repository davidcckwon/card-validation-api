# Credit Card Validator API

A REST API that validates credit card numbers using the Luhn algorithm. Built with TypeScript, Express, and AWS CDK.

## Features

- Validates credit card numbers using the Luhn algorithm
- Detects card schemes (Visa, Mastercard, Amex)
- Strips spaces and dashes from input
- Validates card length (12-19 digits)
- Masks card numbers in logs (only last 4 digits visible)
- Deployable to AWS Lambda + API Gateway or EC2

## API Endpoints

### POST `/validate`

Validates a credit card number.

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

**Response (400 Bad Request):**
```json
{
  "error": "Card number must be between 12-19 digits"
}
```

### GET `/health`

Health check endpoint.

**Response (200 OK):**
```json
{
  "status": "ok"
}
```

## Local Development

### Prerequisites

- Node.js 20+
- pnpm 10+

### Setup

1. Install dependencies:
```bash
pnpm install
```

2. Build the project:
```bash
pnpm run build
```

3. Run tests:
```bash
pnpm test
```

4. Start the development server:
```bash
pnpm run dev
```

The API will be available at `http://localhost:3000`

### Running Tests

Run all tests:
```bash
pnpm test
```

Run tests in watch mode:
```bash
pnpm run test:watch
```

### Test Coverage

The project includes tests for:
- Luhn algorithm (valid/invalid numbers)
- Card validation (input sanitization, length checks)
- Card scheme detection
- API endpoints (200 & 400 responses)

## Docker Deployment

### Build Docker Image

```bash
docker build -f docker/Dockerfile -t card-validator:latest .
```

### Run with Docker Compose

```bash
cd docker
docker-compose up
```

The API will be available at `http://localhost:3000`

### Run Docker Container Directly

```bash
docker run -p 3000:3000 card-validator:latest
```

## AWS EC2 Deployment

### Prerequisites

- AWS CLI configured
- AWS CDK CLI installed (`npm install -g aws-cdk`)
- AWS account with appropriate permissions

### Deploy Infrastructure

1. Bootstrap CDK (first time only):
```bash
pnpm run bootstrap
```

2. Deploy the stack:
```bash
pnpm run deploy
```

Or deploy with specific stage:
```bash
cdk deploy --context stage=prod
```

### Manual EC2 Deployment Steps

If deploying manually to an existing EC2 instance:

1. **SSH into your EC2 instance**

2. **Install Docker:**
```bash
sudo yum update -y
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user
```

3. **Build and push Docker image** (or copy files):
```bash
# Option 1: Build locally and push to ECR
# Option 2: Clone repo and build on EC2
git clone <your-repo-url>
cd card-validation-api
docker build -f docker/Dockerfile -t card-validator:latest .
```

4. **Run container:**
```bash
docker run -d -p 80:3000 \
  --name card-validator \
  --restart always \
  card-validator:latest
```

5. **Configure Security Group:**
   - Open port 80 (HTTP) or 3000 (if using custom port)
   - Allow inbound traffic from your IP or 0.0.0.0/0 (for testing)

6. **Test the API:**
```bash
curl http://<ec2-public-ip>/health
curl -X POST http://<ec2-public-ip>/validate \
  -H "Content-Type: application/json" \
  -d '{"number":"4111111111111111"}'
```

### Using systemd (Alternative to Docker)

1. **Install Node.js on EC2:**
```bash
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs
```

2. **Clone and setup:**
```bash
git clone <your-repo-url>
cd card-validation-api
pnpm install
pnpm run build
```

3. **Create systemd service** (`/etc/systemd/system/card-validator.service`):
```ini
[Unit]
Description=Card Validator API
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user/card-validation-api
ExecStart=/usr/bin/node dist/index.js
Restart=always
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

4. **Start service:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable card-validator
sudo systemctl start card-validator
```

5. **Check status:**
```bash
sudo systemctl status card-validator
```

## Project Structure

```
card-validation-api/
├── bin/              # CDK app entry point
├── lib/               # CDK infrastructure code
├── src/               # Application source code
│   ├── functions/     # Lambda handlers
│   └── libs/          # Core libraries (Luhn, validator)
├── test/              # Test files
├── docker/            # Docker configuration
└── dist/              # Compiled JavaScript (generated)
```

## Luhn Algorithm

The Luhn algorithm validates card numbers by:
1. Starting from the rightmost digit, double every second digit
2. If doubling results in ≥10, subtract 9
3. Sum all digits
4. If sum % 10 == 0, the number is valid

Example: `4539 1488 0343 6467` → valid

## Security Considerations

- Card numbers are masked in logs (only last 4 digits visible)
- Input validation prevents injection attacks
- No card numbers are stored or persisted
- API Gateway provides built-in DDoS protection

## License

ISC

