# Lambda Function Fix Instructions

Follow these steps to fix the ProovdPulse Lambda function in AWS:

## 1. Quick Fix (5 minutes)

This approach will get your widget displaying data immediately:

1. **Log into AWS Console**
   - Go to https://ap-south-1.console.aws.amazon.com/lambda/home
   - Select the region (ap-south-1)
   - Find and click on your `updateUserActivityResolver` function

2. **Replace the Lambda Function Code**
   - In the Lambda function page, click the "Code" tab
   - Delete all existing code in the editor
   - Paste the code from `direct-fix.js` (created in this PR)
   - Click "Deploy" button

3. **Test the Function**
   - Click the "Test" tab
   - Create a new test event with this configuration:
   ```json
   {
     "arguments": {
       "clientId": "test_client",
       "websiteId": "67e0e2226fd66457ee2d2549",
       "metrics": {
         "scrollPercentage": 50,
         "timeOnPage": 60,
         "clickCount": 5
       }
     }
   }
   ```
   - Click "Test" and verify you get a successful response (NOT null)

4. **Verify in your Website**
   - Open your website
   - Check the ProovdPulse widget
   - It should now display values instead of "..."
   - Add some test data using `add-test-stats.js` (added in this PR)

## 2. Permanent Fix (Additional Steps)

After the quick fix is working, implement these steps for a permanent solution:

1. **Check Lambda Environment Variables**
   - In the Lambda function page, click "Configuration" tab
   - Select "Environment variables"
   - Add or update these variables:
     - `MONGODB_URI`: `mongodb+srv://test:test@cluster0.qh719.mongodb.net/proovd?retryWrites=true&w=majority&appName=Cluster0&socketTimeoutMS=60000&connectTimeoutMS=60000&serverSelectionTimeoutMS=30000`
     - `MONGODB_DB`: `proovd`
   - Click "Save"

2. **Update MongoDB Atlas Network Settings**
   - Log into MongoDB Atlas
   - Go to Network Access for your cluster
   - Add a new IP address: `0.0.0.0/0` (or AWS IP ranges for ap-south-1)
   - Enable "Include access from Anywhere"
   - Save changes

3. **Check Lambda Execution Role**
   - In the Lambda function configuration, check the "Permissions" tab
   - Verify the execution role has the following permissions:
     - Basic Lambda execution (CloudWatch Logs)
     - VPC access (if your Lambda is in a VPC)
     - AppSync permissions

4. **Update Response Mapping Template**
   - Go to AppSync console
   - Find your API and navigate to the Schema
   - Find the resolver for `updateUserActivity`
   - Update the response mapping template to handle null responses:
   ```
   #if($ctx.error)
     $util.error($ctx.error.message, $ctx.error.type)
   #end
   
   #if($ctx.result.error)
     $util.error($ctx.result.error)
   #end
   
   #if($ctx.result == null)
     $util.error("Lambda resolver did not return a valid response")
   #end
   
   $util.toJson($ctx.result)
   ```

## 3. Long-term Solution (Future Deployment)

1. **Use Direct DynamoDB or MongoDB Resolvers**
   - Consider replacing the Lambda resolver with direct MongoDB/DynamoDB resolvers
   - This removes the Lambda connection overhead

2. **Monitoring and Alerts**
   - Add CloudWatch Alarms to alert on Lambda errors
   - Monitor MongoDB connection failures

3. **Update CI/CD Pipeline**
   - Add environment variable validation to the build process
   - Ensure MongoDB connection strings are properly passed to Lambda functions

## Need Help?

If you're still experiencing issues:

1. Check CloudWatch logs for the Lambda function
2. Verify MongoDB Atlas connection from other clients
3. Consider switching to a direct DynamoDB-based approach for AppSync 