# Proovd API Documentation

This document provides a complete reference for the Proovd API, allowing you to integrate social proof notifications with your own systems and create custom implementations.

## Authentication

All API requests to website resources are made using the website ID which is included in the URL path.

Example:

```bash
curl -X GET "https://www.proovd.in/api/websites/YOUR_WEBSITE_ID/notifications/show"
```
 
## Rate Limits

To ensure service stability, the API has the following rate limits:

- 100 requests per minute per website ID
- 5,000 requests per day per website ID

Rate limit headers are included in all API responses:

- `X-RateLimit-Limit`: Total requests allowed in the current period
- `X-RateLimit-Remaining`: Requests remaining in the current period
- `X-RateLimit-Reset`: Time (in seconds) until the rate limit resets

## API Endpoints

### Notifications

#### List Notifications for Website

```
GET /api/websites/:websiteId/notifications/show
```

Returns a list of all active notifications for the specified website.

Query parameters:

| Parameter | Type   | Description                          |
|-----------|--------|--------------------------------------|
| url       | string | Current page URL to filter relevant notifications |
| limit     | number | Number of results per page (max 100) |

Response:

```json
{
  "notifications": [
    {
      "id": "not_123456789",
      "name": "Recent Purchase",
      "type": "purchase",
      "message": "Just purchased",
      "productName": "Premium Package",
      "location": "New York",
      "image": "https://ui-avatars.com/api/?name=John+D&background=random",
      "timestamp": "2023-06-15T10:30:00Z"
    },
    {
      "id": "not_987654321",
      "name": "Sarah M.",
      "type": "signup",
      "message": "Just signed up",
      "location": "London",
      "image": "https://ui-avatars.com/api/?name=Sarah+M&background=random",
      "timestamp": "2023-06-10T14:20:00Z"
    }
  ],
  "settings": {
    "position": "bottom-left",
    "theme": "light",
    "displayDuration": 5,
    "delay": 5,
    "maxNotifications": 5
  }
}
```

#### Track Notification Events

```
POST /api/websites/:websiteId/notifications/:notificationId/track
```

Tracks an impression or click event for a notification.

Request body:

```json
{
  "type": "impression",
  "url": "https://example.com/products/item"
}
```

Required fields:
- `type` - One of: "impression", "click"
- `url` - Current page URL

Response:

```json
{
  "success": true
}
```

### Analytics

#### Get Website Statistics

```
GET /api/websites/:websiteId/analytics
```

Returns analytics data for the website.

Query parameters:

| Parameter | Type   | Description                                  |
|-----------|--------|----------------------------------------------|
| period    | string | Time period: "today", "yesterday", "7d", "30d", "all" (default) |

Response:

```json
{
  "overview": {
    "impressions": 1250,
    "clicks": 75,
    "conversionRate": 6.0
  },
  "periods": {
    "today": {
      "impressions": 120,
      "clicks": 8,
      "conversionRate": 6.7
    },
    "yesterday": {
      "impressions": 135,
      "clicks": 12,
      "conversionRate": 8.9
    },
    "last7Days": {
      "impressions": 850,
      "clicks": 65,
      "conversionRate": 7.6
    },
    "last30Days": {
      "impressions": 3200,
      "clicks": 210,
      "conversionRate": 6.6
    }
  },
  "daily": [
    {
      "date": "2023-06-25",
      "impressions": 120,
      "clicks": 8,
      "conversionRate": 6.7
    },
    {
      "date": "2023-06-24",
      "impressions": 135,
      "clicks": 12,
      "conversionRate": 8.9
    }
    // Additional days...
  ]
}
```

### Website Verification

#### Get Verification Instructions

```
GET /api/websites/:websiteId/verify
```

Returns the current verification status and instructions for verifying domain ownership.

Response:

```json
{
  "verification": {
    "status": "pending",
    "method": "DNS",
    "token": "abc123def456",
    "attempts": 0
  },
  "instructions": "Add a TXT record to your domain's DNS with the following values:\nHost: @\nValue: abc123def456\n\nNote: This can take up to 24 hours to propagate."
}
```

#### Update Verification Method

```
POST /api/websites/:websiteId/verify
```

Updates the verification method for a website.

Request body:

```json
{
  "method": "FILE"
}
```

Required fields:
- `method` - One of: "DNS", "FILE", "META"

Response:

```json
{
  "success": true,
  "method": "FILE",
  "token": "abc123def456",
  "status": "pending"
}
```

#### Verify Domain

```
POST /api/websites/:websiteId/verify
```

Attempts to verify the domain using the current verification method.

Response (success):

```json
{
  "success": true,
  "message": "Domain verified successfully!"
}
```

Response (failure):

```json
{
  "success": false,
  "message": "Verification failed: DNS record not found. Please check your DNS settings and try again."
}
```

### Pageview Tracking

```
POST /api/pageview
```

Records a page view for analytics.

Request body:

```json
{
  "websiteId": "website_12345",
  "url": "https://example.com/products/item",
  "referrer": "https://google.com",
  "title": "Product - Example Site"
}
```

Required fields:
- `websiteId` - Website ID
- `url` - Current page URL

Optional fields:
- `referrer` - Referring URL
- `title` - Page title

Response:

```json
{
  "success": true
}
```

## Error Handling

The API uses standard HTTP status codes to indicate success or failure:

- `200 OK` - Request succeeded
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Missing or invalid API key
- `403 Forbidden` - Valid API key but insufficient permissions
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

Error responses have this format:

```json
{
  "error": {
    "code": "invalid_request",
    "message": "The request was invalid. Please check your parameters.",
    "details": {
      "field": "name",
      "issue": "required"
    }
  }
}
```

## Webhooks

You can configure webhooks to receive real-time notifications when certain events occur in your Proovd account.

### Available Webhook Events

- `notification.created` - A new notification is created
- `notification.updated` - A notification is updated
- `notification.deleted` - A notification is deleted
- `notification.impression` - A notification is viewed
- `notification.click` - A notification is clicked

### Webhook Payload Format

```json
{
  "event": "notification.click",
  "timestamp": "2023-06-22T15:30:45Z",
  "data": {
    "notificationId": "not_123456789",
    "siteId": "site_abcdef1234",
    "url": "https://example.com/product",
    "sessionId": "sess_abcdef1234"
  }
}
```

### Webhook Security

All webhook requests include a signature header `X-Proovd-Signature` that you can use to verify the authenticity of the webhook. The signature is created using HMAC SHA-256 with your webhook secret.

## Client Libraries

We provide official client libraries for popular programming languages:

- [JavaScript/Node.js](https://github.com/proovd/proovd-node)
- [PHP](https://github.com/proovd/proovd-php)
- [Python](https://github.com/proovd/proovd-python)
- [Ruby](https://github.com/proovd/proovd-ruby)

## Support

If you have any questions or need help, please contact our support team at proovdbusiness@gmail.com or visit our [Help Center](/dashboard/help). 