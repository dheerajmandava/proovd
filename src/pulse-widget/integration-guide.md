# ProovdPulse Integration Guide

ProovdPulse is a comprehensive social proof and engagement toolkit for e-commerce and web applications. It provides real-time user behavior tracking and innovative widgets to enhance user experience and drive conversions.

## Table of Contents

1. [Installation](#installation)
2. [Basic Setup](#basic-setup)
3. [Configuration Options](#configuration-options)
4. [Available Widgets](#available-widgets)
   - [Viewer Indicator](#viewer-indicator)
   - [Purchase Notification](#purchase-notification)
   - [Stock Status](#stock-status)
   - [Urgency Indicator](#urgency-indicator)
   - [Analytics Widget](#analytics-widget)
5. [Advanced Usage](#advanced-usage)
6. [API Reference](#api-reference)
7. [Browser Compatibility](#browser-compatibility)
8. [Troubleshooting](#troubleshooting)

## Installation

### Direct Script Include

Add the following script to your HTML:

```html
<script src="https://cdn.proovd.in/pulse-widget.min.js"></script>
```

### NPM Installation

```bash
npm install proovd-pulse
```

Then import it in your project:

```javascript
// ES6 import
import { ProovdPulse } from 'proovd-pulse';

// CommonJS
const { ProovdPulse } = require('proovd-pulse');
```

## Basic Setup

### Quick Start

The simplest way to integrate ProovdPulse:

```javascript
// Initialize ProovdPulse
const pulse = new ProovdPulse({
  websiteId: 'YOUR_WEBSITE_ID', // Required
});

// Start tracking and initialize widgets
pulse.init();
```

### Full Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Store</title>
  <script src="https://cdn.proovd.in/pulse-widget.min.js"></script>
</head>
<body>
  <div id="proovd-container"></div>

  <script>
    document.addEventListener('DOMContentLoaded', function() {
      // Initialize ProovdPulse
      const pulse = new ProovdPulse({
        websiteId: 'YOUR_WEBSITE_ID',
        container: '#proovd-container',
        widgets: [
          { type: 'viewers', enabled: true },
          { type: 'purchases', enabled: true },
          { type: 'stock', enabled: true },
          { type: 'urgency', enabled: false }
        ],
        theme: 'light',
        position: 'bottom-right'
      });

      // Start tracking and initialize widgets
      pulse.init().catch(console.error);
    });
  </script>
</body>
</html>
```

## Configuration Options

When initializing ProovdPulse, you can provide the following options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `websiteId` | string | *Required* | Your unique website identifier |
| `serverUrl` | string | Auto | WebSocket server URL (auto-detected based on environment) |
| `clientId` | string | Auto | Client identifier (generated automatically if not provided) |
| `secure` | boolean | Auto | Use secure connection (auto-detected based on environment) |
| `debug` | boolean | `false` | Enable debug logging |
| `reconnectMaxAttempts` | number | 5 | Maximum reconnection attempts |
| `reconnectDelay` | number | 3000 | Delay between reconnection attempts (ms) |
| `container` | string \| HTMLElement | 'body' | Container for widgets |
| `widgets` | WidgetConfig[] | Default set | Widget configurations |
| `theme` | 'light' \| 'dark' \| 'auto' | 'light' | Widget theme |
| `position` | 'top-left' \| 'top-right' \| 'bottom-left' \| 'bottom-right' | 'bottom-right' | Global widget position |
| `shadowDOM` | boolean | `true` | Use Shadow DOM for style isolation |

## Available Widgets

ProovdPulse includes several widgets that can be enabled and configured independently.

### Viewer Indicator

Shows how many people are currently viewing the website or product.

```javascript
// Enable with default settings
pulse.enableWidget('viewers');

// Enable with custom settings
pulse.enableWidget('viewers', {
  minViewers: 2,
  maxViewers: 100,
  prefix: '',
  suffix: '',
  smartText: true,
  singularText: 'person viewing',
  pluralText: 'people viewing',
  showPulse: true,
  textColor: '#ffffff',
  backgroundColor: '#1e3a8a',
  pulseColor: '#3b82f6',
  autoHideAfter: 0,
  expandOnHover: true,
  productSelector: '.product-card',
  productIdAttribute: 'data-product-id',
  productPosition: 'bottom-right'
});
```

### Purchase Notification

Shows recent purchases as toast notifications.

```javascript
// Enable with default settings
pulse.enableWidget('purchases');

// Enable with custom settings
pulse.enableWidget('purchases', {
  maxNotifications: 3,
  displayTime: 5000,
  showTimeAgo: true,
  showLocation: true,
  template: 'Someone from {{location}} purchased {{name}} {{timeAgo}}',
  backgroundColor: '#ffffff',
  textColor: '#1f2937',
  accentColor: '#3b82f6',
  showProductImage: true,
  animationStyle: 'slide',
  queueBehavior: 'stack',
  stackGap: 10
});

// Simulate a purchase notification
pulse.simulatePurchase('Product Name', 'City, Country');
```

### Stock Status

Shows inventory levels and stock status for products.

```javascript
// Enable with default settings
pulse.enableWidget('stock');

// Enable with custom settings
pulse.enableWidget('stock', {
  lowStockThreshold: 5,
  lowStockPercentage: 20,
  lowStockText: 'Low Stock',
  soldOutText: 'Sold Out',
  inStockText: 'In Stock',
  showExactCount: true,
  showPercentage: false,
  showProgressBar: true,
  normalColor: '#10b981',
  lowStockColor: '#f59e0b',
  soldOutColor: '#ef4444',
  productSelector: '[data-product]',
  productIdAttribute: 'data-product-id'
});

// Update stock status
pulse.updateStock('product-123', 8, 20);  // 8 in stock out of 20
```

### Urgency Indicator

Shows time-based countdowns and urgency messages.

```javascript
// Enable with default settings
pulse.enableWidget('urgency');

// Enable with custom settings
pulse.enableWidget('urgency', {
  type: 'countdown',
  prefix: '',
  suffix: '',
  showDays: true,
  showHours: true,
  showMinutes: true,
  showSeconds: true,
  countdownFormat: '{d}d {h}h {m}m {s}s',
  endMessage: 'Offer ended',
  backgroundColor: '#ef4444',
  textColor: '#ffffff',
  pulseAnimation: true,
  flashWhenEnding: true,
  endingSoonThreshold: 300,
  productSelector: '[data-product]',
  productIdAttribute: 'data-product-id'
});

// Show countdown
const endTime = new Date();
endTime.setHours(endTime.getHours() + 24); // 24 hours from now
pulse.showCountdown(endTime.getTime(), 'Sale ends in:');
```

### Analytics Widget

The Analytics Widget provides real-time analytics and data visualization for your website's engagement metrics.

```javascript
const pulse = new ProovdPulse({
  websiteId: 'your-website-id',
  // other options...
  widgets: [
    {
      type: 'analytics',
      enabled: true,
      options: {
        position: 'bottom-right',       // 'top-left', 'top-right', 'bottom-left', 'bottom-right', 'floating'
        theme: 'light',                 // 'light', 'dark', 'auto'
        showInactiveUsers: true,        // Show inactive users count
        inactiveThreshold: 300,         // Seconds of inactivity to consider a user inactive
        chartType: 'line',              // 'line', 'bar', 'pie'
        metrics: [                      // Metrics to display
          'viewers',
          'clicks',
          'scrollDepth',
          'timeOnPage',
          'purchases'
        ],
        refreshInterval: 30,            // Refresh interval in seconds
        showRealTime: true,             // Enable real-time updates
        compactView: true,              // Use compact view by default
        dashboardLink: '/analytics',    // Link to full analytics dashboard
        customColors: [                 // Custom chart colors
          '#4C6FFF',                    // Primary
          '#FF6B6B',                    // Secondary
          '#32D583',                    // Success
          '#F2994A',                    // Warning
          '#BB6BD9'                     // Info
        ]
      }
    }
  ]
});
```

The Analytics Widget automatically collects and displays the following metrics:

* **Active Users**: Number of users currently active on your website
* **Page Views**: Total number of page views
* **Average Time on Page**: Average time users spend on your pages
* **Click Count**: Number of clicks on your website
* **Average Scroll Depth**: How far users scroll down your pages
* **Purchases**: Number of completed purchases
* **Conversion Rate**: Percentage of visitors who complete a purchase

The widget offers both a compact view (showing key metrics) and an expanded view (showing detailed charts). Users can toggle between these views by clicking the expand button.

For more detailed analytics, you can create a full dashboard page by using the data collected by ProovdPulse. A comprehensive dashboard example is available at `/public/analytics-dashboard.html` in the package.

## Advanced Usage

### Dynamically Enabling/Disabling Widgets

```javascript
// Enable a widget
pulse.enableWidget('purchases');

// Disable a widget
pulse.disableWidget('purchases');

// Configure a widget without enabling it
pulse.configureWidget('urgency', {
  type: 'limited-time',
  backgroundColor: '#4338ca'
});
```

### Event Reporting

ProovdPulse automatically tracks user activity, but you can manually report events as well:

```javascript
// Manually report activity metrics
pulse.reportActivity();
```

### Cleanup

```javascript
// Properly clean up when no longer needed
pulse.destroy();
```

## API Reference

### ProovdPulse Class

#### Methods

- `init()`: Initialize the widget
- `enableWidget(type, options)`: Enable a widget with options
- `disableWidget(type)`: Disable a widget
- `configureWidget(type, options)`: Configure a widget
- `simulatePurchase(productName, location)`: Simulate a purchase notification
- `updateStock(productId, currentStock, initialStock)`: Update stock status
- `showCountdown(endTime, message)`: Show countdown timer
- `reportActivity()`: Report current activity metrics
- `destroy()`: Clean up and remove the widget

## Browser Compatibility

ProovdPulse supports all modern browsers:

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Opera (latest)
- Mobile browsers (iOS Safari, Android Chrome)

## Troubleshooting

### Common Issues

**Widget not showing up**
- Ensure your `websiteId` is correct
- Check if the container element exists in the DOM
- Verify that the widget is enabled

**WebSocket connection failing**
- Check your internet connection
- Ensure the server URL is correct
- Verify that WebSockets are not being blocked by a firewall

**Styling conflicts**
- By default, ProovdPulse uses Shadow DOM to isolate styles
- If you disabled Shadow DOM, make sure your CSS doesn't conflict

### Debug Mode

Enable debug mode to see detailed logs in the console:

```javascript
const pulse = new ProovdPulse({
  websiteId: 'YOUR_WEBSITE_ID',
  debug: true
});
```

### Support

For further assistance, contact support@proovd.in or visit our [support portal](https://support.proovd.in). 