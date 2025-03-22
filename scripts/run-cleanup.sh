#!/bin/bash

# Database cleanup script for Proovd
echo "Starting Proovd database cleanup..."

# Run the cleanup script directly with Node
echo "Running cleanup script..."
node ./scripts/cleanup-database.js

echo "Cleanup process completed!" 