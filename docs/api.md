# Proovd API Documentation

This document provides a complete reference for the Proovd API, allowing you to integrate social proof notifications with your own systems and create custom implementations.

## Authentication

All API requests must be authenticated using an API key. You can manage your API keys in the Proovd dashboard under your website's API Keys section.

Add your API key to requests using one of these methods:

- As a query parameter: `?apiKey=YOUR_API_KEY`
- As a header: `X-API-Key: YOUR_API_KEY`

Example:

```bash
curl -X GET "https://api.proovd.in/v1/notifications" \
  -H "X-API-Key: YOUR_API_KEY"
```

## Rate Limits

To ensure service stability, the API has the following rate limits:

- 100 requests per minute per API key
- 5,000 requests per day per API key

Rate limit headers are included in all API responses:

- `X-RateLimit-Limit`: Total requests allowed in the current period
- `X-RateLimit-Remaining`: Requests remaining in the current period
- `X-RateLimit-Reset`: Time (in seconds) until the rate limit resets

## API Endpoints

### Notifications

#### List Notifications

```
GET /v1/notifications
```

Returns a list of all notifications for the authenticated website.

Query parameters:

| Parameter | Type   | Description                          |
|-----------|--------|--------------------------------------|
| status    | string | Filter by status (active, draft, inactive) |
| page      | number | Page number for pagination           |
| limit     | number | Number of results per page (max 100) |

Response:

```json
{
  "data": [
    {
      "id": "not_123456789",
      "name": "Recent Purchase",
      "type": "activity",
      "status": "active",
      "message": "{name} from {location} just purchased {product}",
      "link": "https://example.com/product",
      "createdAt": "2023-06-15T10:30:00Z",
      "updatedAt": "2023-06-15T10:30:00Z"
    },
    {
      "id": "not_987654321",
      "name": "Visitor Count",
      "type": "visitor_count",
      "status": "active",
      "message": "{count} people viewing this page",
      "link": null,
      "createdAt": "2023-06-10T14:20:00Z",
      "updatedAt": "2023-06-10T14:20:00Z"
    }
  ],
  "pagination": {
    "total": 10,
    "pages": 1,
    "page": 1,
    "limit": 25
  }
}
```

#### Get a Notification

```
GET /v1/notifications/:id
```

Returns a specific notification by ID.

Response:

```json
{
  "id": "not_123456789",
  "name": "Recent Purchase",
  "type": "activity",
  "status": "active",
  "message": "{name} from {location} just purchased {product}",
  "link": "https://example.com/product",
  "image": "https://cdn.proovd.in/images/product.webp",
  "displayRules": {
    "pages": ["*"],
    "frequency": "once_per_session",
    "delay": 5
  },
  "stats": {
    "impressions": 1250,
    "clicks": 75,
    "conversionRate": 6.0
  },
  "createdAt": "2023-06-15T10:30:00Z",
  "updatedAt": "2023-06-15T10:30:00Z"
}
```

#### Create a Notification

```
POST /v1/notifications
```

Creates a new notification.

Request body:

```json
{
  "name": "Flash Sale Alert",
  "type": "custom",
  "message": "Flash sale! 25% off all products for the next hour!",
  "link": "https://example.com/sale",
  "image": "https://example.com/images/sale.jpg",
  "status": "draft",
  "displayRules": {
    "pages": ["/products/*", "/categories/*"],
    "frequency": "once_per_session",
    "delay": 10
  }
}
```

Required fields:
- `name` - Internal name for the notification
- `type` - One of: "activity", "visitor_count", "social_proof", "custom"
- `message` - The notification content

Optional fields:
- `link` - URL to redirect when clicked
- `image` - URL of an image to display
- `status` - One of: "active", "draft", "inactive" (default: "draft")
- `displayRules` - Object containing display configuration

Response:

```json
{
  "id": "not_abcdef1234",
  "name": "Flash Sale Alert",
  "type": "custom",
  "message": "Flash sale! 25% off all products for the next hour!",
  "link": "https://example.com/sale",
  "image": "https://example.com/images/sale.jpg",
  "status": "draft",
  "displayRules": {
    "pages": ["/products/*", "/categories/*"],
    "frequency": "once_per_session",
    "delay": 10
  },
  "createdAt": "2023-06-20T09:15:00Z",
  "updatedAt": "2023-06-20T09:15:00Z"
}
```

#### Update a Notification

```
PATCH /v1/notifications/:id
```

Updates an existing notification. Include only the fields you want to update.

Request body:

```json
{
  "status": "active",
  "message": "Updated message content"
}
```

Response:

```json
{
  "id": "not_abcdef1234",
  "name": "Flash Sale Alert",
  "type": "custom",
  "message": "Updated message content",
  "link": "https://example.com/sale",
  "image": "https://example.com/images/sale.jpg",
  "status": "active",
  "displayRules": {
    "pages": ["/products/*", "/categories/*"],
    "frequency": "once_per_session",
    "delay": 10
  },
  "createdAt": "2023-06-20T09:15:00Z",
  "updatedAt": "2023-06-20T10:30:00Z"
}
```

#### Delete a Notification

```
DELETE /v1/notifications/:id
```

Deletes a notification.

Response:

```json
{
  "success": true,
  "message": "Notification deleted successfully"
}
```

### Analytics

#### Get Website Statistics

```
GET /v1/analytics
```

Returns analytics data for the website.

Query parameters:

| Parameter | Type   | Description                                  |
|-----------|--------|----------------------------------------------|
| period    | string | Time period: "today", "yesterday", "7d", "30d", "all" (default) |
| start     | string | Start date (YYYY-MM-DD) for custom range     |
| end       | string | End date (YYYY-MM-DD) for custom range       |

Response:

```json
{
  "impressions": 5280,
  "uniqueImpressions": 4150,
  "clicks": 342,
  "conversionRate": 6.48,
  "timeline": [
    {
      "date": "2023-06-01",
      "impressions": 120,
      "clicks": 8
    },
    {
      "date": "2023-06-02",
      "impressions": 145,
      "clicks": 10
    }
    // ...more timeline entries
  ]
}
```

#### Get Notification Statistics

```
GET /v1/analytics/notifications/:id
```

Returns analytics data for a specific notification.

Query parameters:

| Parameter | Type   | Description                                  |
|-----------|--------|----------------------------------------------|
| period    | string | Time period: "today", "yesterday", "7d", "30d", "all" (default) |

Response:

```json
{
  "impressions": 1250,
  "uniqueImpressions": 980,
  "clicks": 75,
  "conversionRate": 6.0,
  "timeline": [
    {
      "date": "2023-06-01",
      "impressions": 30,
      "clicks": 2
    },
    {
      "date": "2023-06-02",
      "impressions": 42,
      "clicks": 3
    }
    // ...more timeline entries
  ]
}
```

### Events

#### Track Event

```
POST /v1/track
```

Track custom events (impressions or clicks). 

Note: This endpoint is primarily used by the Proovd widget. For most use cases, you should use the widget rather than calling this endpoint directly.

Request body:

```json
{
  "notificationId": "not_123456789",
  "action": "impression",
  "url": "https://example.com/product",
  "sessionId": "sess_abcdef1234",
  "clientId": "client_5678abcd"
}
```

Required fields:
- `notificationId` - The notification ID
- `action` - Type of event: "impression" or "click"

Optional fields:
- `url` - URL where the event occurred
- `sessionId` - Unique session identifier
- `clientId` - Persistent client identifier

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