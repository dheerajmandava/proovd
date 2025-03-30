/**
 * Cache utility for the application
 * Creates a Map with TTL (time-to-live) for entries
 */
/**
 * Creates a cache with TTL (time-to-live) for entries
 * @param ttl Time to live in milliseconds
 * @returns A Map with TTL for entries
 */
export function createCache(ttl) {
    const cache = new Map();
    const expiryTimes = new Map();
    // Clean up expired entries every minute
    const cleanupInterval = setInterval(() => {
        const now = Date.now();
        // Check for expired entries
        for (const [key, expiryTime] of expiryTimes.entries()) {
            if (now > expiryTime) {
                cache.delete(key);
                expiryTimes.delete(key);
            }
        }
    }, 60 * 1000);
    // Extend Map methods to handle TTL
    const originalSet = cache.set;
    cache.set = function (key, value) {
        expiryTimes.set(key, Date.now() + ttl);
        return originalSet.call(this, key, value);
    };
    const originalGet = cache.get;
    cache.get = function (key) {
        const expiryTime = expiryTimes.get(key);
        // Return undefined if entry has expired
        if (expiryTime && Date.now() > expiryTime) {
            cache.delete(key);
            expiryTimes.delete(key);
            return undefined;
        }
        return originalGet.call(this, key);
    };
    const originalDelete = cache.delete;
    cache.delete = function (key) {
        expiryTimes.delete(key);
        return originalDelete.call(this, key);
    };
    const originalClear = cache.clear;
    cache.clear = function () {
        expiryTimes.clear();
        return originalClear.call(this);
    };
    // Add cleanup on process exit
    if (typeof process !== 'undefined') {
        process.on('beforeExit', () => {
            clearInterval(cleanupInterval);
        });
    }
    return cache;
}
