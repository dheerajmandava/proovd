/**
 * ProovdPulse Activity Tracker
 * Monitors user activity on the page and sends metrics to the socket server
 */
import { PulseSocketClient } from './socket-client';
export interface ActivityMetrics {
    clickCount: number;
    scrollPercentage: number;
    timeOnPage: number;
}
export declare class WebsiteActivityTracker {
    private socket;
    private clickCount;
    private scrollPercentage;
    private startTime;
    private isActive;
    private activityTimeout;
    private sendInterval;
    private visibilityHandler;
    private trackScroll;
    private trackClick;
    /**
     * Create a new WebsiteActivityTracker instance
     */
    constructor(socketClient: PulseSocketClient);
    /**
     * Start tracking user activity
     */
    start(): void;
    /**
     * Stop tracking user activity
     */
    stop(): void;
    /**
     * Get the current activity metrics
     */
    getMetrics(): ActivityMetrics;
    /**
     * Handle page visibility changes (tab switching)
     */
    private handleVisibilityChange;
    /**
     * Handle scroll events
     */
    private handleScroll;
    /**
     * Handle click events
     */
    private handleClick;
    /**
     * Start/reset the activity timeout
     */
    private startActivityTimer;
    /**
     * Start the interval to periodically send metrics
     */
    private startSendInterval;
    /**
     * Send activity metrics to the socket server
     */
    private sendActivityMetrics;
}
