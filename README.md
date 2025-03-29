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

## ProovdPulse Real-Time Implementation with AWS AppSync

ProovdPulse now uses AWS AppSync for real-time user engagement tracking. This implementation replaces the custom WebSocket server approach with a fully managed, serverless solution that works seamlessly with AWS Amplify deployments.

### Setting Up AWS AppSync and Amplify

1. **Initialize Amplify in your project**:

```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Initialize Amplify in your project
amplify init
```

Follow the prompts to configure your project, connecting it to your AWS account.

2. **Add GraphQL API to your project**:

```bash
amplify add api
```

Select GraphQL when prompted, and use the following settings:
- API name: `proovdpulse`
- Authorization type: Choose API key for simplicity or Amazon Cognito for better security
- Schema: Use the schema from `amplify/backend/api/proovdpulse/schema.graphql`

3. **Add Lambda functions**:

```bash
amplify add function
```

Create two functions:
- `updateWebsiteStats`: For API resolvers to update stats
- `periodicStatsUpdate`: To periodically update stats for all websites

Use the provided code in:
- `amplify/backend/function/updateWebsiteStats/src/index.js`
- `amplify/backend/function/periodicStatsUpdate/src/index.js`

4. **Deploy Amplify backend**:

```bash
amplify push
```

This will deploy your GraphQL API and Lambda functions to AWS.

5. **Configure environment variables in AWS Amplify Console**:

For your app to connect to AppSync, add these environment variables in the Amplify Console:
- `NEXT_PUBLIC_AWS_REGION`: Your AWS region (e.g., `us-east-1`)
- `NEXT_PUBLIC_APPSYNC_ENDPOINT`: The GraphQL endpoint from AppSync
- `NEXT_PUBLIC_APPSYNC_API_KEY`: The API key from AppSync

### How It Works

1. **Real-time User Tracking**:
   - The ProovdPulse widget uses AWS AppSync subscriptions to receive real-time updates
   - User activity is reported via GraphQL mutations
   - A Lambda function processes this data to calculate engagement metrics

2. **Periodic Updates**:
   - A scheduled Lambda function updates stats for all websites every minute
   - This ensures stats remain accurate even with fluctuating user activity

3. **Website Dashboard**:
   - The dashboard interface connects to the same AppSync API
   - It subscribes to real-time updates for the specific website being viewed

### Benefits Over Custom WebSocket Implementation

- **Scalability**: Automatically scales to handle thousands of concurrent users
- **Reliability**: Fully managed service with high availability
- **Simplified Deployment**: Works seamlessly with Amplify's serverless architecture
- **Reduced Maintenance**: No need to manage WebSocket server infrastructure
- **Cost-Effective**: Pay only for what you use with serverless architecture

### Troubleshooting AppSync Connections

If you're experiencing issues with the AppSync connection, follow these steps:

1. **Verify Environment Variables**:
   - Ensure all AppSync environment variables are properly set in your `.env.local` file locally and in Amplify console for production:
     ```
     NEXT_PUBLIC_AWS_REGION=us-east-1
     NEXT_PUBLIC_APPSYNC_ENDPOINT=https://your-endpoint.appsync-api.region.amazonaws.com/graphql
     NEXT_PUBLIC_APPSYNC_API_KEY=your-api-key
     ```
   - For Amplify deployments, also ensure these are mirrored as `AWS_REGION`, `APPSYNC_ENDPOINT`, and `APPSYNC_API_KEY`

2. **Check Lambda Function Environment**:
   - Verify MongoDB connection details are correctly passed to Lambda functions:
     ```
     MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/database
     MONGODB_DB=proovd
     ```
   - Check CloudWatch logs for any connection errors

3. **Debugging Client Issues**:
   - Open browser developer tools and check for errors in the console
   - Look for network requests to the AppSync endpoint and verify they're being sent correctly
   - Enable ProovdPulse debug logs by adding `debug: true` to the widget configuration

4. **Testing AppSync API Directly**:
   - Use the AWS AppSync console to test mutations and queries directly
   - Verify that your schema is correctly deployed using the Schema page in AppSync console

5. **Common Issues and Solutions**:
   - **Null responses**: Check Lambda function logs for MongoDB connection issues
   - **CORS errors**: Ensure your API allows requests from your domain
   - **Authentication errors**: Verify your API key is valid and not expired
   - **Missing data**: Check that your GraphQL operations match the schema

If problems persist, check the CloudWatch logs for your Lambda functions and the API Gateway logs for more detailed error information.
