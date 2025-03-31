/**
 * ProovdPulse utility functions
 */
const STORAGE_KEY = 'proovd_pulse_client_id';
/**
 * Generate a unique client ID or retrieve from storage
 */
export function generateClientId() {
    // Check if client ID is already stored
    const storedId = localStorage.getItem(STORAGE_KEY);
    if (storedId) {
        console.log('🟢 Using stored client ID:', storedId);
        return storedId;
    }
    // Generate a new client ID
    const newId = generateUUID();
    try {
        // Store the new client ID
        localStorage.setItem(STORAGE_KEY, newId);
        console.log('🟢 Generated and stored new client ID:', newId);
    }
    catch (error) {
        console.error('❌ Failed to store client ID:', error);
    }
    return newId;
}
/**
 * Generate a UUID v4
 */
function generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback implementation if crypto.randomUUID is not available
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
/**
 * Generate a random integer within a range
 */
export function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
/**
 * Delay for a specified number of milliseconds
 */
export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Throttle a function to limit how often it can execute
 */
export function throttle(func, limit) {
    let lastCall = 0;
    return function (...args) {
        const now = Date.now();
        if (now - lastCall >= limit) {
            lastCall = now;
            func(...args);
        }
    };
}
/**
 * Debounce a function to delay its execution until after a period of inactivity
 */
export function debounce(func, wait) {
    let timeout = null;
    return function (...args) {
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(() => {
            func(...args);
        }, wait);
    };
}
/**
 * Safely get a nested property from an object without throwing errors
 */
export function getNestedProperty(obj, path, defaultValue = undefined) {
    try {
        return path.split('.').reduce((o, p) => (o ? o[p] : undefined), obj) || defaultValue;
    }
    catch (error) {
        return defaultValue;
    }
}
/**
 * Check if a value is an object (not null, not array)
 */
export function isObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}
