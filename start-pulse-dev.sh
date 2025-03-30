#!/bin/bash

# ProovdPulse Development Environment Startup Script
# Starts both the Next.js application and WebSocket server

echo "==================================================="
echo "  ProovdPulse Development Environment Startup      "
echo "==================================================="

# Check if socket server directory exists
SOCKET_SERVER_DIR="../proovd-socket-server"

if [ ! -d "$SOCKET_SERVER_DIR" ]; then
    echo "Error: Socket server directory not found at $SOCKET_SERVER_DIR"
    echo "Please ensure the proovd-socket-server is in the correct location"
    exit 1
fi

# Check for node
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    exit 1
fi

# Start socket server in background
echo "Starting ProovdPulse WebSocket server..."
cd "$SOCKET_SERVER_DIR"

if [ ! -f "server.js" ]; then
    echo "Error: server.js not found in $(pwd)"
    exit 1
fi

# Check for environment file
if [ ! -f ".env" ]; then
    echo "Warning: .env file not found in socket server, using default configuration"
fi

# Start socket server in background
node server.js &
SOCKET_PID=$!

# Go back to proovd directory
cd -

echo "Socket server started with PID: $SOCKET_PID"
echo "Starting Next.js application..."

# Start Next.js application
npm run dev &
NEXTJS_PID=$!

echo "Next.js application started with PID: $NEXTJS_PID"
echo ""
echo "ProovdPulse development environment is running!"
echo "- WebSocket Server: http://localhost:3001"
echo "- Next.js App: http://localhost:3000"
echo ""
echo "To test the ProovdPulse widget, open this URL in your browser:"
echo "http://localhost:3000/test-widget.html"
echo ""
echo "Press Ctrl+C to stop all services"

# Handle Ctrl+C to gracefully stop both processes
trap "echo 'Stopping services...'; kill $SOCKET_PID; kill $NEXTJS_PID; exit" INT

# Keep script running
wait 