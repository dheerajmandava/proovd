# Proovd - Social Proof Notifications Platform

## Analytics Implementation

### Overview
The analytics system in Proovd has been enhanced with several improvements for production use:

1. **Unique Impression Tracking**
   - Sessions are identified with unique IDs stored in sessionStorage
   - Persistent user identification via localStorage for cross-session analytics
   - Metrics are tagged as unique or repeated for more accurate reporting

2. **Bot Detection and Filtering**
   - Sophisticated bot detection based on user agent patterns
   - IP address filtering for known crawler and bot networks
   - Behavioral analysis to identify automated traffic
   - Bot traffic is tagged and excluded from core metrics

3. **Background Statistics Calculation**
   - Pre-calculation of metrics in the background to improve dashboard performance
   - Cached statistics at the website and notification level
   - Time-based aggregations (24h, 7d, 30d) for trend analysis
   - Scheduled via a secure cron endpoint

4. **Improved Conversion Rate Calculation**
   - Proper handling of edge cases (e.g., division by zero)
   - Separate tracking for unique impressions vs. all impressions
   - More accurate representation of actual user engagement

### Usage

The analytics data can be accessed in several ways:

1. **Dashboard**
   - Cached statistics appear on the dashboard for quick loading
   - Real-time data is still available when needed

2. **API Access**
   - `/api/websites/[id]/analytics` - Get analytics for a specific website
   - `/api/notifications/[id]/analytics` - Get analytics for a specific notification

3. **Background Processing**
   - Configure a cron job to hit the `/api/cron/calculate-stats` endpoint 
   - Recommended schedule: hourly for high-traffic sites, daily for others
   - Secure with the `CRON_SECRET_TOKEN` environment variable

### Metrics Definitions

- **Impressions**: Total number of times notifications were shown
- **Unique Impressions**: Number of unique sessions where notifications were shown
- **Clicks**: Total number of clicks on notifications
- **Conversion Rate**: Percentage of impressions resulting in clicks (clicks ÷ impressions × 100%)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
