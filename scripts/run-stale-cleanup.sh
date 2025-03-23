#!/bin/bash

# Script to run the stale website cleanup

echo "Starting Proovd stale website cleanup..."

# Set environment if not set
if [ -z "$NODE_ENV" ]; then
  export NODE_ENV=production
  echo "NODE_ENV not set, defaulting to production"
else
  echo "Using NODE_ENV: $NODE_ENV"
fi

# Go to project root
cd "$(dirname "$0")/.."

# Run the cleanup script
echo "Running stale cleanup script..."
node ./scripts/cleanup-stale-websites.js

echo "Cleanup process completed!" 