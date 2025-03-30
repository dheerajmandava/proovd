/**
 * ProovdPulse Widget
 * Real-time website visitor tracking and engagement metrics
 * Production-ready version with secure connections and advanced options
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
        // Determine environment
        this.isProduction = typeof window !== 'undefined'
            ? window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1')
            : false;
        // Set default server URL based on environment
        if (!this.options.serverUrl) {
            this.options.serverUrl = this.isProduction
                ? 'wss://socket.proovd.in'
                : 'ws://localhost:3001';
        }
        else if (this.isProduction && this.options.serverUrl === 'ws://localhost:3001') {
            this.options.serverUrl = 'wss://socket.proovd.in';
        }
        // Set secure option based on environment
        if (this.options.secure === undefined) {
            this.options.secure = this.isProduction;
        }
        this.log('Initializing with options:', this.options);
        // Create socket client
        this.socketClient = new PulseSocketClient(this.options.clientId, this.options.websiteId, this.options.serverUrl, {
            authToken: this.options.authToken,
            secure: this.options.secure,
            debug: this.options.debug,
            reconnectMaxAttempts: this.options.reconnectMaxAttempts,
            reconnectBaseDelay: this.options.reconnectBaseDelay,
            reconnectMaxDelay: this.options.reconnectMaxDelay
        });
        // Create UI component
        this.ui = new PulseUI(options);
        // Handle stats updates
        this.socketClient.on('stats', (data) => {
            if (data.websiteId === this.options.websiteId) {
                this.ui.updateUserCount(data.activeUsers || 0);
            }
        });
        // Handle connection events
        this.socketClient.on('connect', () => {
            this.log('Connected to ProovdPulse server');
        });
        this.socketClient.on('disconnect', (data) => {
            this.log('Disconnected from ProovdPulse server', data);
        });
        this.socketClient.on('error', (data) => {
            this.log('Error connecting to ProovdPulse server', data);
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
            this.log('Initialized successfully');
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
        this.log('Destroyed');
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
    /**
     * Log messages if debug is enabled
     */
    log(message, ...args) {
        if (this.options.debug) {
            console.log(`ProovdPulse: ${message}`, ...args);
        }
    }
}
