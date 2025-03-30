/**
 * Formats a date as a human-readable time ago string
 * @param dateString Date string to format
 * @returns Formatted time ago string
 */
export function timeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const secondsAgo = Math.round((now.getTime() - date.getTime()) / 1000);
    // Less than a minute
    if (secondsAgo < 60) {
        return 'just now';
    }
    // Minutes
    const minutesAgo = Math.round(secondsAgo / 60);
    if (minutesAgo < 60) {
        return `${minutesAgo} ${minutesAgo === 1 ? 'minute' : 'minutes'} ago`;
    }
    // Hours
    const hoursAgo = Math.round(minutesAgo / 60);
    if (hoursAgo < 24) {
        return `${hoursAgo} ${hoursAgo === 1 ? 'hour' : 'hours'} ago`;
    }
    // Days
    const daysAgo = Math.round(hoursAgo / 24);
    if (daysAgo < 30) {
        return `${daysAgo} ${daysAgo === 1 ? 'day' : 'days'} ago`;
    }
    // Months
    const monthsAgo = Math.round(daysAgo / 30);
    if (monthsAgo < 12) {
        return `${monthsAgo} ${monthsAgo === 1 ? 'month' : 'months'} ago`;
    }
    // Years
    const yearsAgo = Math.round(daysAgo / 365);
    return `${yearsAgo} ${yearsAgo === 1 ? 'year' : 'years'} ago`;
}
/**
 * Format a number with thousand separators
 * @param value Number to format
 * @returns Formatted number string
 */
export function formatNumber(value) {
    return new Intl.NumberFormat().format(value);
}
/**
 * Format a percentage
 * @param value Number to format as percentage
 * @param decimals Number of decimal places
 * @returns Formatted percentage string
 */
export function formatPercent(value, decimals = 2) {
    return `${value.toFixed(decimals)}%`;
}
/**
 * Truncate text with ellipsis
 * @param text Text to truncate
 * @param length Maximum length
 * @returns Truncated text
 */
export function truncate(text, length = 100) {
    if (text.length <= length)
        return text;
    return text.slice(0, length) + '...';
}
/**
 * Simple validation for email format
 * @param email Email to validate
 * @returns True if valid email format
 */
export function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}
/**
 * Generate a random string ID
 * @param length Length of the ID
 * @returns Random string ID
 */
export function generateId(length = 8) {
    return Math.random().toString(36).substring(2, 2 + length);
}
/**
 * Get initials from a name
 * @param name Full name
 * @returns Initials (2 characters)
 */
export function getInitials(name) {
    if (!name)
        return '';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length === 1)
        return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
/**
 * Format a number with commas
 * @param number Number to format
 * @returns Formatted number string
 */
export function formatNumberWithCommas(number) {
    return new Intl.NumberFormat().format(number);
}
/**
 * Format a percentage value
 * @param number Number to format as percentage
 * @returns Formatted percentage string
 */
export function formatPercentValue(number) {
    return `${number.toFixed(2)}%`;
}
/**
 * Format a date in a human-readable format
 * @param date Date to format
 * @returns Formatted date string
 */
export function formatDate(date) {
    if (!date)
        return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}
/**
 * Format a time in a human-readable format
 * @param date Date to format
 * @returns Formatted time string
 */
export function formatTime(date) {
    if (!date)
        return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}
/**
 * Format a date and time in a human-readable format
 * @param date Date to format
 * @returns Formatted date and time string
 */
export function formatDateTime(date) {
    if (!date)
        return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return `${formatDate(dateObj)} at ${formatTime(dateObj)}`;
}
/**
 * Format a date as a relative time (e.g., "5 minutes ago")
 * @param date Date to format
 * @returns Formatted relative time string
 */
export function formatTimeAgo(date) {
    if (!date)
        return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
    if (diffInSeconds < 60) {
        return 'just now';
    }
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    }
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    }
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
        return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    }
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
        return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago`;
    }
    const diffInYears = Math.floor(diffInMonths / 12);
    return `${diffInYears} year${diffInYears !== 1 ? 's' : ''} ago`;
}
/**
 * Format a currency value
 * @param amount Amount to format
 * @param currency Currency code (default: USD)
 * @returns Formatted currency string
 */
export function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2
    }).format(amount);
}
/**
 * Safely handle undefined or null values
 * @param obj Object to access
 * @param path Path to the value
 * @param defaultValue Default value to return if path is invalid
 * @returns Accessed value or default value
 */
export function safelyGetValue(obj, path, defaultValue) {
    try {
        const keys = path.split('.');
        let result = obj;
        for (const key of keys) {
            if (result === undefined || result === null) {
                return defaultValue;
            }
            result = result[key];
        }
        return (result === undefined || result === null) ? defaultValue : result;
    }
    catch (error) {
        return defaultValue;
    }
}
/**
 * Truncate text to a specific length
 * @param text Text to truncate
 * @param maxLength Maximum length
 * @returns Truncated text
 */
export function truncateText(text, maxLength = 100) {
    if (!text)
        return '';
    if (text.length <= maxLength)
        return text;
    return text.substring(0, maxLength) + '...';
}
/**
 * Check if object is empty
 * @param obj Object to check
 * @returns True if object is empty
 */
export function isEmptyObject(obj) {
    return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
}
/**
 * Deep compare two objects for equality
 * @param obj1 First object to compare
 * @param obj2 Second object to compare
 * @returns True if objects are equal
 */
export function deepEqual(obj1, obj2) {
    if (obj1 === obj2)
        return true;
    if (typeof obj1 !== 'object' || obj1 === null ||
        typeof obj2 !== 'object' || obj2 === null) {
        return false;
    }
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    if (keys1.length !== keys2.length)
        return false;
    for (const key of keys1) {
        if (!keys2.includes(key))
            return false;
        if (!deepEqual(obj1[key], obj2[key]))
            return false;
    }
    return true;
}
/**
 * Sleep for a specified time (useful for async functions)
 * @param ms Time to sleep in milliseconds
 * @returns Promise that resolves after the specified time
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Debounce a function
 * @param func Function to debounce
 * @param waitFor Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce(func, waitFor) {
    let timeout = null;
    return function (...args) {
        if (timeout !== null) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(() => func(...args), waitFor);
    };
}
/**
 * Throttle a function
 * @param func Function to throttle
 * @param waitFor Wait time in milliseconds
 * @returns Throttled function
 */
export function throttle(func, waitFor) {
    let waiting = false;
    let lastArgs = null;
    return function (...args) {
        if (waiting) {
            lastArgs = args;
            return;
        }
        func(...args);
        waiting = true;
        setTimeout(() => {
            waiting = false;
            if (lastArgs) {
                func(...lastArgs);
                lastArgs = null;
            }
        }, waitFor);
    };
}
/**
 * Generate a random string (useful for IDs, etc.)
 * @param length Length of the random string
 * @returns Random string
 */
export function generateRandomString(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
/**
 * Export other util modules for convenience
 */
export * from './form-validation';
export * from './client-error';
export * from './server-error';
