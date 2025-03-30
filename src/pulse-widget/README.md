# ProovdPulse Widget

A real-time website visitor tracking and analytics widget for any website.

## Overview

ProovdPulse provides live user tracking, visitor engagement metrics, and real-time analytics directly on your website. The widget displays active visitor counts and communicates with the ProovdPulse WebSocket server to track user interactions.

## Features

- **Live Active Users Counter** - Show how many people are currently viewing your website
- **Real-time Analytics** - Track clicks, scroll depth, and time on page
- **Beautiful UI** - Sleek, customizable widget that fits any website design
- **Lightweight** - Minimal impact on page load times
- **Privacy-compliant** - No cookies required, GDPR-friendly

## Installation

### Option 1: Direct Script Tag

Add the following script to your website's HTML:

```html
<script src="https://www.proovd.in/api/websites/YOUR_WEBSITE_ID/pulse-widget.js" async></script>
```

Replace `YOUR_WEBSITE_ID` with your unique ProovdPulse website ID.

### Option 2: NPM Installation

Install the package:

```bash
npm install proovd-pulse
```

Import and initialize in your application:

```javascript
import { ProovdPulse } from 'proovd-pulse';

const pulse = new ProovdPulse({
  websiteId: 'YOUR_WEBSITE_ID',
  // Additional options...
});

pulse.init();
```

## Configuration Options

You can customize ProovdPulse with the following options:

```javascript
const pulse = new ProovdPulse({
  // Required
  websiteId: 'YOUR_WEBSITE_ID',
  
  // Optional
  serverUrl: 'wss://socket.proovd.in', // WebSocket server URL
  authToken: 'YOUR_AUTH_TOKEN',        // Authentication token
  clientId: 'CUSTOM_CLIENT_ID',        // Custom client ID (generated if not provided)
  
  // Widget Appearance
  widgetPosition: 'bottom-right',      // 'bottom-right', 'bottom-left', 'top-right', 'top-left'
  widgetColors: {
    background: '#1e293b',             // Widget background color
    text: '#ffffff',                   // Widget text color
    pulse: '#3b82f6'                   // Pulse indicator color
  },
  customText: {
    activeUserLabel: 'Active Users',   // Label for active users
    pulseLabel: 'ProovdPulse'          // Widget label
  },
  hideWidgetOnMobile: true,            // Hide widget on mobile devices
  
  // Advanced Options
  debug: false,                        // Enable debug logging
  secure: true,                        // Force secure WebSocket connection
  reconnectMaxAttempts: 10,            // Max connection retry attempts
  reconnectBaseDelay: 1000,            // Base delay between reconnection attempts (ms)
  reconnectMaxDelay: 30000             // Maximum delay between reconnection attempts (ms)
});
```

## API Reference

### Methods

#### `init()`

Initialize the widget and start tracking.

```javascript
pulse.init();
```

#### `destroy()`

Stop tracking and remove the widget.

```javascript
pulse.destroy();
```

### Events

ProovdPulse uses the WebSocket connection to communicate with the server and update the widget display. Events are handled internally, but you can access the internal socket client for custom handling if needed.

## Building From Source

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the widget:
   ```bash
   npm run build:pulse
   ```

The compiled files will be available in the `dist/pulse-widget` directory.

## Integration With Next.js

ProovdPulse is designed to work seamlessly with Next.js applications. For server components, the widget is loaded dynamically on the client side to avoid hydration issues.

Example usage in a Next.js app:

```jsx
'use client';

import { useEffect } from 'react';
import { ProovdPulse } from 'proovd-pulse';

export default function PulseWidget({ websiteId }) {
  useEffect(() => {
    // Initialize widget on client side
    const pulse = new ProovdPulse({
      websiteId,
      debug: process.env.NODE_ENV === 'development'
    });
    
    pulse.init();
    
    // Clean up on unmount
    return () => pulse.destroy();
  }, [websiteId]);
  
  return null; // Widget renders itself
}
```

## Troubleshooting

### Common Issues

- **Widget not showing**: Check if your website ID is correct and the script is loading properly
- **No active users shown**: Ensure the WebSocket server is running and accessible
- **Connection errors**: Check network connectivity and firewall settings

### Debug Mode

Enable debug mode to see detailed logs in the console:

```javascript
const pulse = new ProovdPulse({
  websiteId: 'YOUR_WEBSITE_ID',
  debug: true
});
```

## Security and Privacy

ProovdPulse is designed with privacy in mind:

- No cookies are used for tracking
- No personal information is collected
- All communication is secure via WebSocket over TLS
- No impact on website performance or SEO

## License

This project is licensed under the MIT License.