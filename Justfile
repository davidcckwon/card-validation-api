# Default: show available commands
default:
    @just --list

# Local development commands
build-local:
    @echo "Building Docker image..."
    docker-compose build

start-local:
    @echo "Starting local development server..."
    docker-compose up

stop-local:
    @echo "Stopping containers..."
    docker-compose stop

restart-local: stop-local start-local
    @echo "Restarting local server..."

logs-local:
    @echo "Showing logs..."
    docker-compose logs -f

destroy-local:
    @echo "Stopping and removing containers..."
    docker-compose down --remove-orphans

clean-local:
    @echo "Cleaning up containers and volumes..."
    docker-compose down --remove-orphans -v

# Cloud deployment commands
build:
    @echo "Building..."
    pnpm run build

deploy: build
    @echo "Deploying to AWS..."
    cdk deploy --require-approval never

deploy-interactive: build
    @echo "Deploying to AWS (interactive)..."
    cdk deploy

destroy:
    @echo "Destroying environment..."
    cdk destroy --force

synth: build
    @echo "Synthesizing CloudFormation template..."
    cdk synth

diff:
    @echo "Showing differences..."
    cdk diff

outputs:
    @echo "Fetching stack outputs..."
    @aws cloudformation describe-stacks --stack-name card-validator-api --query 'Stacks[0].Outputs' --output table || echo "Stack not found or AWS CLI not configured"

logs:
    @echo "Fetching EC2 instance logs..."
    @INSTANCE_ID=$$(aws cloudformation describe-stacks --stack-name card-validator-api --query 'Stacks[0].Outputs[?OutputKey==`Ec2InstanceId`].OutputValue' --output text 2>/dev/null) && \
    if [ -n "$$INSTANCE_ID" ]; then \
        echo "Connecting to instance $$INSTANCE_ID..."; \
        aws ssm start-session --target $$INSTANCE_ID --document-name AWS-StartInteractiveCommand --parameters command="docker logs card-validator-api --tail 50"; \
    else \
        echo "Could not find instance ID. Is the stack deployed?"; \
    fi

ssh:
    @echo "Connecting to EC2 instance via SSM..."
    @INSTANCE_ID=$$(aws cloudformation describe-stacks --stack-name card-validator-api --query 'Stacks[0].Outputs[?OutputKey==`Ec2InstanceId`].OutputValue' --output text 2>/dev/null) && \
    if [ -n "$$INSTANCE_ID" ]; then \
        aws ssm start-session --target $$INSTANCE_ID; \
    else \
        echo "Could not find instance ID. Is the stack deployed?"; \
    fi

health:
    @echo "Checking API health..."
    @ENDPOINT=$$(aws cloudformation describe-stacks --stack-name card-validator-api --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' --output text 2>/dev/null) && \
    if [ -n "$$ENDPOINT" ]; then \
        curl -s $$ENDPOINT/health | jq . || curl -s $$ENDPOINT/health; \
    else \
        echo "Could not find endpoint. Is the stack deployed?"; \
    fi

update-container:
    @echo "Updating container on EC2 instance..."
    @INSTANCE_ID=$$(aws cloudformation describe-stacks --stack-name card-validator-api --query 'Stacks[0].Outputs[?OutputKey==`Ec2InstanceId`].OutputValue' --output text 2>/dev/null) && \
    REGION=$$(aws configure get region) && \
    ACCOUNT=$$(aws sts get-caller-identity --query Account --output text) && \
    ECR_REGISTRY="$$ACCOUNT.dkr.ecr.$$REGION.amazonaws.com" && \
    REPO_NAME="cdk-hnb659fds-container-assets-$$ACCOUNT-$$REGION" && \
    if [ -n "$$INSTANCE_ID" ]; then \
        echo "Getting latest image from ECR..."; \
        IMAGE_TAG=$$(aws ecr describe-images --repository-name $$REPO_NAME --query 'sort_by(imageDetails,&imagePushedAt)[-1].imageTags[0]' --output text 2>/dev/null); \
        if [ -z "$$IMAGE_TAG" ] || [ "$$IMAGE_TAG" = "None" ]; then \
            echo "Warning: Could not find image tag, trying to get digest..."; \
            IMAGE_DIGEST=$$(aws ecr describe-images --repository-name $$REPO_NAME --query 'sort_by(imageDetails,&imagePushedAt)[-1].imageDigest' --output text 2>/dev/null); \
            if [ -n "$$IMAGE_DIGEST" ] && [ "$$IMAGE_DIGEST" != "None" ]; then \
                ECR_IMAGE="$$ECR_REGISTRY/$$REPO_NAME@$$IMAGE_DIGEST"; \
            else \
                echo "Error: Could not find image in ECR. Run 'just deploy' first."; \
                exit 1; \
            fi; \
        else \
            ECR_IMAGE="$$ECR_REGISTRY/$$REPO_NAME:$$IMAGE_TAG"; \
        fi; \
        echo "Instance: $$INSTANCE_ID"; \
        echo "Pulling image: $$ECR_IMAGE"; \
        COMMAND_ID=$$(aws ssm send-command \
            --instance-ids $$INSTANCE_ID \
            --document-name "AWS-RunShellScript" \
            --parameters "commands=[\"aws ecr get-login-password --region $$REGION | docker login --username AWS --password-stdin $$ECR_REGISTRY\",\"docker stop card-validator-api || true\",\"docker rm card-validator-api || true\",\"docker pull $$ECR_IMAGE\",\"docker run -d --name card-validator-api -p 3000:3000 --restart unless-stopped $$ECR_IMAGE\",\"sleep 3\",\"docker ps -a | grep card-validator-api\"]" \
            --output text --query 'Command.CommandId'); \
        echo "Command ID: $$COMMAND_ID"; \
        echo "Container update initiated. Check status with: aws ssm get-command-invocation --command-id $$COMMAND_ID --instance-id $$INSTANCE_ID"; \
    else \
        echo "Could not find instance ID. Is the stack deployed?"; \
    fi

restart-container:
    @echo "Restarting container on EC2 instance..."
    @INSTANCE_ID=$$(aws cloudformation describe-stacks --stack-name card-validator-api --query 'Stacks[0].Outputs[?OutputKey==`Ec2InstanceId`].OutputValue' --output text 2>/dev/null) && \
    if [ -n "$$INSTANCE_ID" ]; then \
        aws ssm send-command \
            --instance-ids $$INSTANCE_ID \
            --document-name "AWS-RunShellScript" \
            --parameters 'commands=["docker restart card-validator-api","sleep 2","docker ps -a | grep card-validator-api"]' \
            --output text --query 'Command.CommandId' && \
        echo "Restart command sent."; \
    else \
        echo "Could not find instance ID. Is the stack deployed?"; \
    fi

bootstrap:
    @echo "Bootstrapping CDK environment..."
    cdk bootstrap

# Utility commands
test:
    @echo "Running tests..."
    pnpm test

lint:
    @echo "Checking for linting errors..."
    pnpm run build

