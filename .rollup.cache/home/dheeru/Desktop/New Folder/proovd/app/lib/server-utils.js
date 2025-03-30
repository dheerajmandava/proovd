import crypto from 'crypto';
// Utility function to sanitize input
export function sanitizeInput(input) {
    if (!input)
        return '';
    // Remove potentially dangerous characters
    return input
        .replace(/<(?:.|\n)*?>/gm, '') // Remove HTML tags
        .replace(/[^\w\s.,\-_@]/gi, ''); // Remove special chars except safe ones
}
// Generate a random string with specified length
export function generateRandomString(length = 32) {
    return crypto.randomBytes(Math.ceil(length / 2))
        .toString('hex')
        .slice(0, length);
}
// Extract domain from URL
export function extractDomain(url) {
    try {
        // Check if URL has protocol, if not add it
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        const parsedUrl = new URL(url);
        return parsedUrl.hostname.toLowerCase();
    }
    catch (e) {
        // If URL parsing fails, return the input as is
        return url.toLowerCase();
    }
}
// Generate a unique ID for a website
export function generateWebsiteId() {
    return crypto.randomBytes(16).toString('hex');
}
// Hash a value using SHA-256
export function hashValue(value) {
    return crypto
        .createHash('sha256')
        .update(value)
        .digest('hex');
}
// Format a date to YYYY-MM-DD format
export function formatDate(date) {
    return date.toISOString().split('T')[0];
}
// Get yesterday's date in YYYY-MM-DD format
export function getYesterday() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return formatDate(yesterday);
}
// Format number with commas
export function formatNumberWithCommas(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
/**
 * Validates a URL format
 * @param {string} url - The URL to validate
 * @returns {boolean} Whether the URL is valid
 */
export function isValidUrl(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    }
    catch (e) {
        return false;
    }
}
/**
 * Checks if the provided value is a MongoDB ObjectId
 * @param {string} id - The ID to check
 * @returns {boolean} Whether the ID is a valid ObjectId
 */
export function isValidObjectId(id) {
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    return objectIdPattern.test(id);
}
/**
 * Generate a random location for demo purposes
 */
export function getRandomLocation() {
    const cities = [
        'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix',
        'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose',
        'London', 'Paris', 'Berlin', 'Madrid', 'Rome',
        'Tokyo', 'Sydney', 'Toronto', 'Singapore', 'Dubai'
    ];
    return cities[Math.floor(Math.random() * cities.length)];
}
/**
 * Get the plan limits based on the plan name
 * @param plan The plan name
 * @returns Object containing the plan limits
 */
export function getPlanLimits(plan) {
    switch (plan) {
        case 'free':
            return {
                pageviews: 5000,
                websites: 1,
                historyDays: 7,
            };
        case 'starter':
            return {
                pageviews: 50000,
                websites: 3,
                historyDays: 30,
            };
        case 'growth':
            return {
                pageviews: 200000,
                websites: 10,
                historyDays: 90,
            };
        case 'business':
            return {
                pageviews: 1000000,
                websites: 25,
                historyDays: 365,
            };
        default:
            return {
                pageviews: 5000,
                websites: 1,
                historyDays: 7,
            };
    }
}
/**
 * Checks if a website is verified
 * @param website The website object to check
 * @returns Boolean indicating if the website is verified
 */
export function isWebsiteVerified(website) {
    return website.verification.status === 'verified' || website.status === 'verified';
}
/**
 * Middleware-style function to verify website verification status
 * @param website The website object to check
 * @param onUnverified Optional callback for custom handling of unverified websites
 * @returns NextResponse with error if website is not verified, otherwise null
 */
export function requireVerifiedWebsite(website, onUnverified) {
    if (!isWebsiteVerified(website)) {
        return new Response(JSON.stringify({
            error: 'Website must be verified before accessing this resource',
            verificationRequired: true
        }), {
            status: 403,
            headers: {
                'Content-Type': 'application/json',
            }
        });
    }
    return null;
}
