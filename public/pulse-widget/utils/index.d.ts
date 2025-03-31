/**
 * ProovdPulse utility functions
 */
/**
 * Generate a unique client ID or retrieve from storage
 */
export declare function generateClientId(): string;
/**
 * Generate a random integer within a range
 */
export declare function getRandomInt(min: number, max: number): number;
/**
 * Delay for a specified number of milliseconds
 */
export declare function delay(ms: number): Promise<void>;
/**
 * Throttle a function to limit how often it can execute
 */
export declare function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void;
/**
 * Debounce a function to delay its execution until after a period of inactivity
 */
export declare function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void;
/**
 * Safely get a nested property from an object without throwing errors
 */
export declare function getNestedProperty(obj: any, path: string, defaultValue?: any): any;
/**
 * Check if a value is an object (not null, not array)
 */
export declare function isObject(value: any): boolean;
