const WebSocket = require('ws');

// Configuration
const clientId = 'test-client-' + Math.random().toString(36).substring(2, 10);
const websiteId = '67e0e2226fd66457ee2d254d';
const serverUrl = 'ws://localhost:3001';

console.log(`Starting WebSocket test with clientId ${clientId} and websiteId ${websiteId}`);

// Connect to WebSocket server
const socket = new WebSocket(serverUrl);

socket.on('open', () => {
  console.log('Connected to WebSocket server');
  
  // Send join message
  const joinMessage = {
    type: 'join',
    clientId,
    websiteId
  };
  socket.send(JSON.stringify(joinMessage));
  console.log('Sent join message', joinMessage);
  
  // Send activity after 2 seconds
  setTimeout(() => {
    const activityMessage = {
      type: 'activity',
      clientId,
      websiteId,
      metrics: {
        clickCount: 3,
        scrollPercentage: 75,
        timeOnPage: 30
      }
    };
    socket.send(JSON.stringify(activityMessage));
    console.log('Sent activity message', activityMessage);
    
    // Close after 5 more seconds
    setTimeout(() => {
      const leaveMessage = {
        type: 'leave',
        clientId,
        websiteId
      };
      socket.send(JSON.stringify(leaveMessage));
      console.log('Sent leave message', leaveMessage);
      
      socket.close();
      console.log('Closed WebSocket connection');
    }, 5000);
  }, 2000);
});

socket.on('message', (data) => {
  console.log('Received message:', data.toString());
  try {
    const parsedData = JSON.parse(data.toString());
    console.log('Parsed message:', parsedData);
  } catch (error) {
    console.error('Error parsing message:', error);
  }
});

socket.on('close', (code, reason) => {
  console.log(`WebSocket connection closed: ${code} ${reason}`);
});

socket.on('error', (error) => {
  console.error('WebSocket error:', error);
}); 