/**
 * ProovdPulse Widget
 * Real-time website visitor tracking and engagement metrics
 */
import { PulseSocketClient } from './socket-client';
import { PulseUI } from './pulse-ui';
import { v4 as uuidv4 } from 'uuid';
export class ProovdPulse {
    constructor(options) {
        this.metrics = {
            clickCount: 0,
            scrollPercentage: 0,
            timeOnPage: 0
        };
        this.isTracking = false;
        this.startTime = 0;
        this.activityInterval = null;
        this.maxScrollPercentage = 0;
        this.clickHandler = null;
        this.scrollHandler = null;
        this.options = options;
        // Generate a client ID if not provided
        if (!this.options.clientId) {
            this.options.clientId = this.getClientId();
        }
        // Create socket client
        this.socketClient = new PulseSocketClient(this.options.clientId, this.options.websiteId, this.options.serverUrl);
        // Create UI component
        this.ui = new PulseUI(options);
        // Handle stats updates
        this.socketClient.on('stats', (data) => {
            if (data.websiteId === this.options.websiteId) {
                this.ui.updateUserCount(data.activeUsers || 0);
            }
        });
    }
    /**
     * Initialize the widget
     */
    async init() {
        try {
            // Mount UI
            this.ui.mount();
            // Connect to socket server
            await this.socketClient.connect();
            // Start tracking activity
            this.startTracking();
            console.log('ProovdPulse: Initialized successfully');
        }
        catch (error) {
            console.error('ProovdPulse: Failed to initialize', error);
        }
    }
    /**
     * Start tracking user activity
     */
    startTracking() {
        if (this.isTracking)
            return;
        this.isTracking = true;
        this.startTime = Date.now();
        // Track clicks
        this.clickHandler = () => {
            this.metrics.clickCount += 1;
        };
        document.addEventListener('click', this.clickHandler);
        // Track scroll depth
        this.scrollHandler = () => {
            const scrollHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, document.body.offsetHeight, document.documentElement.offsetHeight, document.body.clientHeight, document.documentElement.clientHeight);
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const windowHeight = window.innerHeight;
            const scrollPercentage = Math.min(Math.round((scrollTop / (scrollHeight - windowHeight)) * 100), 100);
            this.maxScrollPercentage = Math.max(scrollPercentage, this.maxScrollPercentage);
        };
        document.addEventListener('scroll', this.scrollHandler);
        // Send activity reports periodically
        this.activityInterval = window.setInterval(() => {
            this.reportActivity();
        }, 5000); // 5 seconds
        // Report activity when user leaves page
        window.addEventListener('beforeunload', () => {
            this.reportActivity();
            this.destroy();
        });
    }
    /**
     * Report current activity metrics
     */
    reportActivity() {
        if (!this.isTracking)
            return;
        // Calculate time on page
        const timeOnPage = Math.round((Date.now() - this.startTime) / 1000);
        // Prepare metrics
        const currentMetrics = {
            clickCount: this.metrics.clickCount,
            scrollPercentage: this.maxScrollPercentage,
            timeOnPage
        };
        // Send activity update
        this.socketClient.sendActivity(currentMetrics);
        // Reset click count for next report
        this.metrics.clickCount = 0;
    }
    /**
     * Destroy the widget and clean up
     */
    destroy() {
        // Stop tracking
        this.isTracking = false;
        // Clear interval
        if (this.activityInterval !== null) {
            clearInterval(this.activityInterval);
            this.activityInterval = null;
        }
        // Remove event listeners
        if (this.clickHandler) {
            document.removeEventListener('click', this.clickHandler);
            this.clickHandler = null;
        }
        if (this.scrollHandler) {
            document.removeEventListener('scroll', this.scrollHandler);
            this.scrollHandler = null;
        }
        // Disconnect socket
        this.socketClient.disconnect();
        // Unmount UI
        this.ui.unmount();
        console.log('ProovdPulse: Destroyed');
    }
    /**
     * Get or create a client ID
     */
    getClientId() {
        // Try to get from localStorage first
        const storedId = localStorage.getItem('proovdPulseClientId');
        if (storedId) {
            return storedId;
        }
        // Generate a new ID
        const newId = uuidv4();
        localStorage.setItem('proovdPulseClientId', newId);
        return newId;
    }
}
