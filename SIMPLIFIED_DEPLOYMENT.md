# ProovdPulse Simplified Deployment Guide

We've completely redesigned the ProovdPulse system to eliminate JWT authentication, making it similar to your notification widget. Here's how to deploy it:

## 1. Socket Server Changes

The socket server now uses a much simpler approach:
- No JWT verification - just basic websiteId validation
- Automatic website creation in the database
- Domain-based validation similar to your notification widget
- Fixed reconnection timeouts for better reliability

### Deployment Steps:

1. SSH into your EC2 instance:
   ```bash
   ssh -i "your-key.pem" ec2-user@socket.proovd.in
   ```

2. Navigate to your socket server directory:
   ```bash
   cd ~/proovd-socket-server
   ```

3. Back up your existing server file:
   ```bash
   cp server.js server.js.backup
   ```

4. Upload the new server.js file (from your local machine):
   ```bash
   scp -i "your-key.pem" proovd-socket-server/server.js ec2-user@socket.proovd.in:~/proovd-socket-server/
   ```

5. Restart the service:
   ```bash
   sudo systemctl restart proovdpulse
   ```

6. Check logs to verify it started correctly:
   ```bash
   sudo journalctl -u proovdpulse -f
   ```

## 2. Widget Updates

The widget code has also been simplified:
- Removed all JWT token handling
- Simplified reconnection logic
- Added explicit join message when connected
- Fixed the circular reference bug that caused initialization failures

### Deployment Steps:

1. Build the widget:
   ```bash
   npm run build:widget
   ```

2. This creates a new `public/pulse-widget.min.js` file

3. Deploy your Next.js app through Amplify as usual:
   ```bash
   git add .
   git commit -m "Simplified ProovdPulse widget with no auth"
   git push
   ```

## Testing the Widget

1. On your website where the widget is installed, open the browser console
2. Look for messages starting with "ProovdPulse:"
3. You should see successful connection messages without any "Authentication required" errors
4. If testing locally, use the test widget HTML page at http://localhost:3000/test-widget.html

## Troubleshooting

If you still see authentication errors on your production site:
1. Make sure the EC2 instance is running the updated server.js file
2. Verify that the widget script on your website is the latest version (check the file timestamp or add a version parameter to the script URL)
3. Check that the WebSocket URL is correct (should be wss://socket.proovd.in)
4. Ensure your MongoDB connection is working properly

## CORS Configuration

The server is currently configured to accept connections from any origin. For production, you may want to restrict this to only your domains:

```javascript
app.use(cors({
  origin: ['https://proovd.in', 'https://www.proovd.in', 'https://arxfile.com']
}));
```

## Monitoring

To monitor active connections and server health:
1. SSH into your EC2 instance
2. Check the socket server logs:
   ```bash
   sudo journalctl -u proovdpulse -f
   ```
3. Or access the stats endpoint:
   ```bash
   curl http://localhost:3001/stats
   ```

## Complete Rollback (If Needed)

If you need to revert to the previous version:
1. On the EC2 instance:
   ```bash
   cp server.js.backup server.js
   sudo systemctl restart proovdpulse
   ```
2. For the widget, revert to your previous git commit and redeploy through Amplify 