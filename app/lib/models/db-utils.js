/**
 * Helper function to retry database operations that might fail
 * @param {Function} operation - The database operation to perform
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} delay - Delay between retries in milliseconds
 * @returns {Promise<any>} - The result of the operation
 */
export async function retryDbOperation(operation, maxRetries = 3, delay = 1000) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`DB operation attempt ${attempt}/${maxRetries}`);
      const result = await operation();
      console.log(`DB operation succeeded on attempt ${attempt}`);
      return result;
    } catch (error) {
      console.error(`DB operation failed on attempt ${attempt}:`, error.message);
      lastError = error;
      
      // Don't wait after the last attempt
      if (attempt < maxRetries) {
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // If we get here, all attempts failed
  console.error(`All ${maxRetries} DB operation attempts failed.`);
  throw lastError;
} 