#!/bin/bash

# ProovdPulse WebSocket Server Startup Script

echo "Starting ProovdPulse WebSocket Server..."

# Define paths
SOCKET_SERVER_PATH="../proovd-socket-server"
SERVER_FILE="server.js"

# Check if socket server directory exists
if [ ! -d "$SOCKET_SERVER_PATH" ]; then
  echo "Error: Socket server directory not found at $SOCKET_SERVER_PATH"
  exit 1
fi

# Go to socket server directory
cd "$SOCKET_SERVER_PATH" || exit 1

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    exit 1
fi

# Check if server.js exists
if [ ! -f "$SERVER_FILE" ]; then
    echo "Error: server.js not found in $(pwd)"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Warning: .env file not found, using default configuration"
    
    # Create basic .env file for development
    cat > .env << EOL
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb+srv://proovd:proovd@proovd.2zg.mongodb.net/proovd
JWT_SECRET=development-secret-key
MAX_CONNECTIONS_PER_IP=50
EOL
    echo "Created default .env file"
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start the server
echo "Starting socket server at http://localhost:3001"
node "$SERVER_FILE" 