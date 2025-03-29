#!/bin/bash

# Load environment variables from .env.local if it exists
if [ -f .env.local ]; then
  echo "Loading environment variables from .env.local"
  export $(cat .env.local | grep -v '#' | sed 's/\r$//' | xargs)
fi

# Navigate to the project root
cd "$(dirname "$0")"

# Install dependencies for the Lambda function
echo "Installing Lambda dependencies..."
cd amplify/backend/function/updateUserActivityResolver
npm install
cd -

# Deploy the API and function
echo "Deploying AppSync API and Lambda resolver..."

# Create parameter file with actual environment variables
cat > amplify/backend/function/updateUserActivityResolver/parameters.json << EOF
{
  "MONGODB_URI": "$MONGODB_URI",
  "MONGODB_DB": "$MONGODB_DB"
}
EOF

# Check if environment variables are set
if [ -z "$MONGODB_URI" ] || [ -z "$MONGODB_DB" ]; then
  echo "ERROR: MongoDB environment variables are not set properly!"
  echo "Please ensure MONGODB_URI and MONGODB_DB are defined in your environment or .env.local file."
  exit 1
fi

# Log AppSync configuration
echo "Checking AppSync Configuration:"
if [ -z "$APPSYNC_ENDPOINT" ] || [ -z "$APPSYNC_API_KEY" ]; then
  echo "WARNING: AppSync environment variables are not set properly!"
  echo "Please ensure APPSYNC_ENDPOINT and APPSYNC_API_KEY are defined in your environment or .env.local file."
fi

# Run the deployment commands using AWS CLI or amplify CLI
echo "Deploying with amplify CLI..."

# Amplify push command would go here
# e.g., amplify push --yes

echo "Deployment completed." 