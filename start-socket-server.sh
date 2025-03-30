#!/bin/bash

# Start ProovdPulse WebSocket Server

echo "Starting ProovdPulse WebSocket Server..."
cd ../proovd-socket-server

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    exit 1
fi

# Check if server.js exists
if [ ! -f "server.js" ]; then
    echo "Error: server.js not found in $(pwd)"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Warning: .env file not found, using default configuration"
fi

# Start the server
echo "Starting socket server at http://localhost:3001"
node server.js 