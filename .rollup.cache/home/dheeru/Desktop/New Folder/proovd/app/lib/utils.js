'use client';
/**
 * Sanitizes user input to prevent XSS attacks
 * @param {string} input - The input to sanitize
 * @returns {string} The sanitized input
 */
export function sanitizeInput(input) {
    if (!input)
        return '';
    // Convert to string if not already
    const str = String(input);
    // Replace potentially dangerous characters
    return str
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}
/**
 * Validates a URL format
 * @param {string} url - The URL to validate
 * @returns {boolean} Whether the URL is valid
 */
export function isValidUrl(url) {
    try {
        // Add protocol if missing for URL parsing
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        const urlObj = new URL(url);
        return urlObj.hostname.includes('.');
    }
    catch (e) {
        return false;
    }
}
/**
 * Validates if a string is a valid domain name
 * @param {string} domain - The domain to validate
 * @returns {boolean} Whether the domain is valid
 */
export function isValidDomain(domain) {
    // Basic domain format validation (example.com)
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
    // Try direct validation
    if (domainRegex.test(domain)) {
        return true;
    }
    // Try extracting domain from URL and validate
    try {
        // Add protocol if missing for URL parsing
        if (!domain.startsWith('http://') && !domain.startsWith('https://')) {
            domain = 'https://' + domain;
        }
        const urlObj = new URL(domain);
        return domainRegex.test(urlObj.hostname);
    }
    catch (e) {
        return false;
    }
}
/**
 * Formats a number for display (adds commas, abbreviates large numbers)
 * @param {number} num - The number to format
 * @returns {string} The formatted number
 */
export function formatNumber(num) {
    if (num === undefined || num === null)
        return '0';
    if (num === 0)
        return '0';
    // For small numbers, just add commas
    if (num < 1000) {
        return num.toString();
    }
    // For 1,000 to 999,999
    if (num < 1000000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    // For 1,000,000 to 999,999,999
    if (num < 1000000000) {
        return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    // For 1,000,000,000+
    return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
}
/**
 * Formats a date for display
 * @param {Date} date - The date to format
 * @returns {string} The formatted date
 */
export function formatDate(date) {
    if (!date)
        return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}
/**
 * Formats a date and time for display
 * @param {Date} date - The date to format
 * @returns {string} The formatted date and time
 */
export function formatDateTime(date) {
    if (!date)
        return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
/**
 * Returns a time-ago string (e.g., "5 minutes ago")
 * @param {Date} date - The date to format
 * @returns {string} The time-ago string
 */
export function timeAgo(date) {
    if (!date)
        return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (seconds < 60) {
        return 'just now';
    }
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
        return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }
    const days = Math.floor(hours / 24);
    if (days < 7) {
        return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
    return formatDate(d);
}
/**
 * Truncates a string if it's longer than maxLength
 * @param {string} str - The string to truncate
 * @param {number} maxLength - The maximum length
 * @returns {string} The truncated string
 */
export function truncate(str, maxLength = 50) {
    if (!str)
        return '';
    if (str.length <= maxLength)
        return str;
    return str.substring(0, maxLength) + '...';
}
/**
 * Generates a random color
 * @returns {string} A random hex color
 */
export function randomColor() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
}
/**
 * Validates an email format
 * @param {string} email - The email to validate
 * @returns {boolean} Whether the email is valid
 */
export function isValidEmail(email) {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
/**
 * Safely parses JSON with a fallback
 * @param {string} json - The JSON string to parse
 * @param {any} fallback - The fallback value if parsing fails
 * @returns {any} The parsed JSON or fallback
 */
export function safeJsonParse(json, fallback = {}) {
    try {
        return JSON.parse(json);
    }
    catch (e) {
        return fallback;
    }
}
/**
 * Extracts domain from a URL
 * @param {string} url - The URL to extract domain from
 * @returns {string} The domain
 */
export function extractDomain(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname;
    }
    catch (e) {
        return '';
    }
}
/**
 * Delays execution for a specified time
 * @param {number} ms - The time to delay in milliseconds
 * @returns {Promise<void>} A promise that resolves after the delay
 */
export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Removes HTML tags from a string
 * @param {string} html - The HTML string to clean
 * @returns {string} The text without HTML tags
 */
export function stripHtml(html) {
    if (!html)
        return '';
    return html.replace(/<[^>]*>?/gm, '');
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
 * Format a relative time (e.g., "2 minutes ago")
 */
export function formatRelativeTime(date) {
    const now = new Date();
    const past = new Date(date);
    const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);
    if (seconds < 60) {
        return 'Just now';
    }
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
        return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }
    const days = Math.floor(hours / 24);
    if (days < 30) {
        return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
    const months = Math.floor(days / 30);
    if (months < 12) {
        return `${months} month${months !== 1 ? 's' : ''} ago`;
    }
    const years = Math.floor(months / 12);
    return `${years} year${years !== 1 ? 's' : ''} ago`;
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
 * Format a timestamp as a time-ago string (e.g., "5 minutes ago")
 * @param {Date|string} timestamp - The timestamp to format
 * @returns {string} The formatted time-ago string
 */
export function formatTimeAgo(timestamp) {
    if (!timestamp)
        return '';
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) {
        return 'just now';
    }
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
        return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }
    const days = Math.floor(hours / 24);
    if (days < 7) {
        return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
    if (days < 30) {
        const weeks = Math.floor(days / 7);
        return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
    }
    const months = Math.floor(days / 30);
    if (months < 12) {
        return `${months} month${months !== 1 ? 's' : ''} ago`;
    }
    const years = Math.floor(months / 12);
    return `${years} year${years !== 1 ? 's' : ''} ago`;
}
