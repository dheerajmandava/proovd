import { Amplify } from 'aws-amplify';

// Initialize AWS Amplify with v6 format
Amplify.configure({
  API: {
    GraphQL: {
      endpoint: process.env.NEXT_PUBLIC_APPSYNC_ENDPOINT,
      region: process.env.NEXT_PUBLIC_AWS_REGION || 'ap-south-1',
      defaultAuthMode: 'apiKey',
      apiKey: process.env.NEXT_PUBLIC_APPSYNC_API_KEY
    }
  },
  // Analytics is disabled by default
  Analytics: {
    disabled: true
  }
});

export default Amplify; 