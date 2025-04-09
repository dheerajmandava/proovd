# Getting Started with Proovd

Proovd is a social proof notification platform that helps you increase conversions by showcasing real-time user activity on your website. This guide will walk you through the essential steps to set up and start using Proovd.

## Table of Contents
- [Account Setup](#account-setup)
- [Adding Your First Website](#adding-your-first-website)
- [Verifying Your Domain](#verifying-your-domain)
- [Creating Your First Notification](#creating-your-first-notification)
- [Installing the Widget](#installing-the-widget)
- [Customizing Appearance](#customizing-appearance)
- [Tracking Performance](#tracking-performance)

## Account Setup

1. **Create an account**: Sign up at [app.proovd.in/auth/signup](https://app.proovd.in/auth/signup)
2. **Verify your email**: Click the verification link sent to your email
3. **Complete your profile**: Add your name and organization details

## Adding Your First Website

1. From your dashboard, click **Websites** in the sidebar
2. Click the **Add Website** button
3. Enter your website details:
   - **Name**: A friendly name for your website (e.g., "My E-commerce Store")
   - **Domain**: Your website's domain (e.g., "example.com")
4. Click **Create Website**

## Verifying Your Domain

To ensure that only you can display notifications for your domain, you'll need to verify ownership:

1. From your website's overview page, click the **Setup** tab
2. Choose one of the verification methods:
   
   **Option 1: Meta Tag Verification**
   - Copy the provided meta tag
   - Add it to the `<head>` section of your website's HTML
   - Click **Verify Domain**
   
   **Option 2: File Verification**
   - Download the verification file
   - Upload it to your website's root directory
   - Click **Verify Domain**

3. Once verified, you'll see a success message and your domain status will change to "Verified"

## Creating Your First Notification

1. Navigate to your website settings by clicking on its name in the Websites list
2. Click the **Notifications** tab
3. Click **Create Notification**
4. Choose a notification type:
   - **Recent Activity**: Show recent purchases or sign-ups
   - **Live Visitor Count**: Display current visitor numbers
   - **Social Proof**: Highlight testimonials or reviews
   - **Custom**: Create your own notification format
5. Fill in the notification details:
   - **Name**: Internal name for your reference
   - **Message**: What visitors will see (e.g., "John from New York just purchased Product X")
   - **Link**: Where visitors will go if they click the notification
   - **Image**: Optional product or profile image
6. Set display rules (optional):
   - **Pages**: Which pages should show this notification
   - **Frequency**: How often to show it to the same visitor
   - **Delay**: How long to wait before showing after page load
7. Click **Save Notification**

## Installing the Widget

1. Go to your website's **Setup** tab
2. Copy the installation code snippet:
   ```html
   <script src="https://www.proovd.in/api/cdn/w/YOUR_WEBSITE_ID.js"></script>
   ```
3. Add this code to your website just before the closing `</body>` tag
4. Save and deploy your website changes

## Customizing Appearance

1. Go to your website's **Settings** tab
2. Customize the appearance of notifications:
   - **Position**: Choose where notifications appear (top-left, top-right, bottom-left, bottom-right)
   - **Theme**: Select light or dark theme
   - **Display Duration**: How long each notification stays visible
   - **Delay Between Notifications**: Interval between consecutive notifications
   - **Maximum Notifications**: Limit how many notifications a visitor sees per session

## Tracking Performance

1. Go to your website's **Overview** tab to see performance metrics:
   - **Impressions**: How many times notifications were shown
   - **Clicks**: How many times visitors clicked on notifications
   - **Conversion Rate**: Percentage of notifications that led to clicks
2. Use these insights to optimize your notifications over time

## Next Steps

- Explore the [API Documentation](/docs/api) to integrate Proovd with your custom systems
- Create multiple notifications for different pages or products
- Set up A/B testing to find the most effective notification styles
- Adjust your notification strategy based on performance data

For more help, check our [FAQ](/dashboard/help) or contact support at proovdbusiness@gmail.com. 