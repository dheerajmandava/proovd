#!/bin/bash
# Deploy AppSync API and DynamoDB resolvers

set -e

echo "==============================================="
echo "ProovdPulse Resolver Deployment"
echo "==============================================="
echo "This script will deploy the AppSync resolvers"
echo "for the ProovdPulse analytics widget."
echo

# Create build folder if it doesn't exist
mkdir -p amplify/backend/api/proovd/build/resolvers

# Copy resolver templates
echo "Copying resolver templates..."

# Mutation resolvers
echo "- Copying updateUserActivity resolvers"
cp -f amplify/backend/api/proovd/resolvers/Mutation.updateUserActivity.req.vtl amplify/backend/api/proovd/build/resolvers/Mutation.updateUserActivity.req.vtl
cp -f amplify/backend/api/proovd/resolvers/Mutation.updateUserActivity.res.vtl amplify/backend/api/proovd/build/resolvers/Mutation.updateUserActivity.res.vtl

# Query resolvers
echo "- Copying getWebsiteStats resolvers"
cp -f amplify/backend/api/proovd/resolvers/Query.getWebsiteStats.req.vtl amplify/backend/api/proovd/build/resolvers/Query.getWebsiteStats.req.vtl
cp -f amplify/backend/api/proovd/resolvers/Query.getWebsiteStats.res.vtl amplify/backend/api/proovd/build/resolvers/Query.getWebsiteStats.res.vtl

# Subscription resolvers
echo "- Copying onActiveUserChange resolvers"
cp -f amplify/backend/api/proovd/resolvers/Subscription.onActiveUserChange.req.vtl amplify/backend/api/proovd/build/resolvers/Subscription.onActiveUserChange.req.vtl
cp -f amplify/backend/api/proovd/resolvers/Subscription.onActiveUserChange.res.vtl amplify/backend/api/proovd/build/resolvers/Subscription.onActiveUserChange.res.vtl

# Verify that the resolvers are in place
echo "Verifying resolvers..."
if [ ! -f amplify/backend/api/proovd/build/resolvers/Mutation.updateUserActivity.req.vtl ]; then
  echo "ERROR: Mutation.updateUserActivity.req.vtl not found in build directory"
  exit 1
fi

# Push to AWS
echo "Pushing changes to AWS..."
amplify push --yes

echo "=================================================="
echo "Deployment complete!"
echo "=================================================="
echo "IMPORTANT: To test the changes, use the test-widget.html"
echo "page with your AppSync endpoint and API key."
echo
echo "Testing steps:"
echo "1. Open app/test-widget.html in a browser"
echo "2. Check browser console for logs"
echo "3. Click 'Trigger Activity Report' to test"
echo "4. Verify that WebsiteStats are updated in DynamoDB"
echo
echo "If you're still seeing errors, check CloudWatch logs"
echo "for the AppSync API or check DynamoDB table schemas."
echo "==================================================" 