#!/bin/bash

# Navigate to the project root
cd "$(dirname "$0")"

# Install dependencies for the Lambda function
echo "Installing Lambda dependencies..."
cd amplify/backend/function/updateUserActivityResolver
npm install
cd -

# Deploy the API and function
echo "Deploying AppSync API and Lambda resolver..."
amplify push --y

echo "Deployment complete!" 