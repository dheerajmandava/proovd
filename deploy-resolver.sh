#!/bin/bash

# Load environment variables from .env.local if it exists
if [ -f .env.local ]; then
  echo "Loading environment variables from .env.local"
  export $(cat .env.local | grep -v '#' | sed 's/\r$//' | xargs)
fi

# Check for required environment variables
if [ -z "$MONGODB_URI" ] || [ -z "$MONGODB_DB" ]; then
  echo "ERROR: MongoDB environment variables missing!"
  echo "Please ensure MONGODB_URI and MONGODB_DB are set in your .env.local file."
  exit 1
fi

if [ -z "$NEXT_PUBLIC_APPSYNC_ENDPOINT" ] || [ -z "$NEXT_PUBLIC_APPSYNC_API_KEY" ]; then
  echo "ERROR: AppSync environment variables missing!"
  echo "Please ensure NEXT_PUBLIC_APPSYNC_ENDPOINT and NEXT_PUBLIC_APPSYNC_API_KEY are set in your .env.local file."
  exit 1
fi

# Install dependencies in the Lambda function directory
echo "Installing Lambda dependencies..."
cd amplify/backend/function/updateUserActivityResolver
npm install
cd ../../../..

# Deploy AppSync API and Lambda resolver
echo "Deploying AppSync API and Lambda resolver..."

# Create parameter file with actual environment variables
cat > amplify/backend/function/updateUserActivityResolver/parameters.json << EOF
{
  "MONGODB_URI": "$MONGODB_URI",
  "MONGODB_DB": "$MONGODB_DB"
}
EOF

# Display configuration
echo "=== Configuration Summary ==="
echo "MongoDB Database: $MONGODB_DB"
echo "AppSync Region: ${NEXT_PUBLIC_AWS_REGION:-ap-south-1}"
echo "MongoDB URI: ${MONGODB_URI:0:25}... (truncated for security)"
echo "========================"

# Run the Amplify push with environment variables
echo "Running amplify push with environment variables..."
MONGODB_URI="$MONGODB_URI" MONGODB_DB="$MONGODB_DB" amplify push --yes

echo "Deployment completed! Check CloudWatch logs for Lambda function execution details."
echo "AppSync API Endpoint: $NEXT_PUBLIC_APPSYNC_ENDPOINT" 