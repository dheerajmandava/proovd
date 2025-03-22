# Proovd Database and Workflow Scripts

This directory contains utility scripts for managing the Proovd application.

## Database Cleanup Script

The database cleanup script (`cleanup-database.js`) performs the following operations:

1. Removes any test websites (example.com, test.com, etc.)
2. Fixes schema issues related to API keys
3. Ensures there are no duplicate or null API keys
4. Converts from legacy apiKey field to the new apiKeys array model

### How to Use

Run the cleanup script using npm:

```bash
npm run db:cleanup
```

## Verification Workflow

The correct workflow for website registration and API key generation is:

1. **Website Creation**: 
   - User adds a new website (domain and name)
   - System validates that the domain exists
   - Website is created with `status: 'pending'`
   - **No API key is generated at this point**

2. **Domain Verification**:
   - User verifies domain ownership using one of three methods:
     - DNS TXT record
     - File upload verification
     - Meta tag verification
   - Once verification is successful, website status changes to `'verified'`
   - **Only after verification** is the first API key automatically generated

3. **API Key Management**:
   - User can only manage API keys for verified websites
   - If a user tries to access the API keys page for an unverified website, they're redirected to verification

This approach ensures that API keys are only generated for verified domains, preventing the previous issues with null or duplicate keys in the database. 