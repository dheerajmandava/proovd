#!/bin/bash
# Script to directly update AppSync resolvers without schema changes

set -e

echo "==============================================="
echo "ProovdPulse Resolver Fix"
echo "==============================================="
echo "This script will update the DynamoDB resolvers directly"
echo

# Use hardcoded values
API_ID="5qhnhm4zrrh2jb5hcz4m3ua7eu"
REGION="ap-south-1"
USER_SESSION_DS="UserSessionTable"
WEBSITE_STATS_DS="WebsiteStatsTable"
SUBSCRIPTION_DS="NONE_DS"

echo "Using API ID: $API_ID"
echo "Using region: $REGION"
echo "Using data sources:"
echo "  - UserSession: $USER_SESSION_DS"
echo "  - WebsiteStats: $WEBSITE_STATS_DS"
echo "  - Subscription: $SUBSCRIPTION_DS"
echo

echo "Ensuring build directory exists..."
mkdir -p amplify/backend/api/proovd/build/resolvers

echo "Copying resolver templates to build directory..."
cp -f amplify/backend/api/proovd/resolvers/Mutation.updateUserActivity.req.vtl amplify/backend/api/proovd/build/resolvers/
cp -f amplify/backend/api/proovd/resolvers/Mutation.updateUserActivity.res.vtl amplify/backend/api/proovd/build/resolvers/
cp -f amplify/backend/api/proovd/resolvers/Query.getWebsiteStats.req.vtl amplify/backend/api/proovd/build/resolvers/
cp -f amplify/backend/api/proovd/resolvers/Query.getWebsiteStats.res.vtl amplify/backend/api/proovd/build/resolvers/
cp -f amplify/backend/api/proovd/resolvers/Subscription.onActiveUserChange.req.vtl amplify/backend/api/proovd/build/resolvers/
cp -f amplify/backend/api/proovd/resolvers/Subscription.onActiveUserChange.res.vtl amplify/backend/api/proovd/build/resolvers/

echo "Verifying AWS CLI is properly configured..."
aws sts get-caller-identity

echo "Updating Mutation.updateUserActivity resolver..."
aws appsync update-resolver \
  --api-id $API_ID \
  --type-name Mutation \
  --field-name updateUserActivity \
  --region $REGION \
  --data-source-name $USER_SESSION_DS \
  --request-mapping-template "$(cat amplify/backend/api/proovd/resolvers/Mutation.updateUserActivity.req.vtl)" \
  --response-mapping-template "$(cat amplify/backend/api/proovd/resolvers/Mutation.updateUserActivity.res.vtl)"

echo "Updating Query.getWebsiteStats resolver..."
aws appsync update-resolver \
  --api-id $API_ID \
  --type-name Query \
  --field-name getWebsiteStats \
  --region $REGION \
  --data-source-name $WEBSITE_STATS_DS \
  --request-mapping-template "$(cat amplify/backend/api/proovd/resolvers/Query.getWebsiteStats.req.vtl)" \
  --response-mapping-template "$(cat amplify/backend/api/proovd/resolvers/Query.getWebsiteStats.res.vtl)"

echo "Updating Subscription.onActiveUserChange resolver..."
aws appsync update-resolver \
  --api-id $API_ID \
  --type-name Subscription \
  --field-name onActiveUserChange \
  --region $REGION \
  --data-source-name $SUBSCRIPTION_DS \
  --request-mapping-template "$(cat amplify/backend/api/proovd/resolvers/Subscription.onActiveUserChange.req.vtl)" \
  --response-mapping-template "$(cat amplify/backend/api/proovd/resolvers/Subscription.onActiveUserChange.res.vtl)"

echo "=================================================="
echo "Resolver update complete!"
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