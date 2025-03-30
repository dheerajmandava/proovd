# ProovdPulse Widget

Real-time website visitor tracking and engagement widget.

## Features

- Real-time active user count display
- Click tracking
- Scroll depth tracking
- Time on page metrics
- WebSocket communication for real-time updates
- Customizable UI with multiple position options
- Production-ready with secure connections
- Authentication support for secure environments

## Usage

### Basic Usage

Add the ProovdPulse widget to your website by including the script and initializing it:

```html
<!-- Include the UUID library (required dependency) -->
<script src="https://cdn.jsdelivr.net/npm/uuid@9.0.0/dist/umd/uuidv4.min.js"></script>

<!-- Include the ProovdPulse widget -->
<script type="module">
  import { ProovdPulse } from './path/to/proovd-pulse.js';
  
  document.addEventListener('DOMContentLoaded', async () => {
    window.proovdPulse = new ProovdPulse({
      websiteId: 'your-website-id',
      serverUrl: 'wss://socket.proovd.in',
      container: 'body',
      position: 'bottom-right'
    });
    
    await window.proovdPulse.init();
  });
</script>
```

### Configuration Options

The ProovdPulse widget accepts the following configuration options:

```javascript
const options = {
  // Required options
  websiteId: 'your-website-id',  // Unique identifier for your website
  serverUrl: 'wss://socket.proovd.in',  // WebSocket server URL
  
  // UI options
  container: 'body',  // CSS selector for the container element
  position: 'bottom-right',  // Widget position: 'top-left', 'top-right', 'bottom-left', 'bottom-right'
  showPulse: true,  // Whether to show the pulse animation
  pulseColor: '#4338ca',  // Color of the pulse indicator
  theme: 'light',  // Widget theme: 'light' or 'dark'
  textColor: '#111827',  // Text color
  backgroundColor: '#ffffff',  // Background color
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',  // Font family
  fontSize: '14px',  // Font size
  borderRadius: '8px',  // Border radius
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',  // Box shadow
  zIndex: 9999,  // CSS z-index
  
  // Advanced options
  clientId: 'optional-client-id',  // Optional client ID (generated if not provided)
  authToken: 'jwt-token',  // JWT token for authentication in production
  secure: true,  // Use secure WebSocket connection (wss://)
  debug: false,  // Enable debug logging
  reconnectMaxAttempts: 10,  // Maximum reconnection attempts
  reconnectBaseDelay: 1000,  // Base delay for reconnection in ms
  reconnectMaxDelay: 30000   // Maximum delay for reconnection in ms
};
```

### Production Deployment

For production use, we recommend the following configuration:

```javascript
window.proovdPulse = new ProovdPulse({
  websiteId: 'your-website-id',
  serverUrl: 'wss://socket.proovd.in',
  authToken: 'your-jwt-token', // Obtain from your ProovdPulse admin
  secure: true,
  position: 'bottom-right',
  debug: false
});
```

You can host the widget files on your own CDN or use the ProovdPulse CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/uuid@9.0.0/dist/umd/uuidv4.min.js"></script>
<script type="module">
  import { ProovdPulse } from 'https://cdn.proovd.in/pulse-widget/proovd-pulse.js';
  
  // Initialize as shown above
</script>
```

### Cleanup

Always clean up the widget when it's no longer needed:

```javascript
// Clean up when component unmounts
window.proovdPulse.destroy();
```

## Development

To develop the ProovdPulse widget:

1. Edit the files in the `src/pulse-widget` directory
2. Build the widget using TypeScript:
   ```
   npx tsc -p src/pulse-widget/tsconfig.json
   ```
3. Test it by opening `app/test-widget.html` in a browser

## WebSocket Server

The ProovdPulse widget requires the ProovdPulse WebSocket server to be running. In development, the server runs at `ws://localhost:3001`. In production, use the secure WebSocket server at `wss://socket.proovd.in`.

See the [WebSocket Server Deployment Guide](../../proovd-socket-server/DEPLOYMENT.md) for instructions on setting up your own server instance.

## Authentication

For production environments, the widget uses JWT authentication. To obtain a token:

1. Contact your ProovdPulse administrator
2. Request a JWT token for your website ID
3. Include the token in your widget configuration

Tokens are typically valid for one year and can be rotated as needed for security.

## Browser Compatibility

The ProovdPulse widget is compatible with all modern browsers:

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

## License

© Proovd. All rights reserved.