/**
 * ProovdPulse Widget
 * Real-time website visitor tracking and engagement metrics
 * Production-ready version with secure connections and advanced options
 */
import { PulseSocketClient } from './socket-client';
import { v4 as uuidv4 } from 'uuid';
import { widgetRegistry } from './widget-registry';
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
        this.reconnectAttempts = 0;
        this.container = null;
        this.shadow = null;
        this.widgetsContainer = null;
        // Make a copy of options to avoid mutation issues
        this.options = { ...options };
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
        // Set default container
        if (!this.options.container) {
            this.options.container = 'body';
        }
        // Set default theme
        if (!this.options.theme) {
            this.options.theme = 'light';
        }
        // Set default position
        if (!this.options.position) {
            this.options.position = 'bottom-right';
        }
        // Set default for shadow DOM
        if (this.options.shadowDOM === undefined) {
            this.options.shadowDOM = true;
        }
        // Set default widgets if not provided
        if (!this.options.widgets) {
            this.options.widgets = [
                { type: 'viewers', enabled: true },
                { type: 'purchases', enabled: false },
                { type: 'stock', enabled: false },
                { type: 'urgency', enabled: false }
            ];
        }
        this.maxReconnectAttempts = this.options.reconnectMaxAttempts || 5;
        this.log('Initializing with options:', this.options);
        // Create socket client - ensure we have all required properties first
        if (!this.options.clientId || !this.options.websiteId || !this.options.serverUrl) {
            console.error('ProovdPulse: Missing required options', {
                clientId: this.options.clientId,
                websiteId: this.options.websiteId,
                serverUrl: this.options.serverUrl
            });
            throw new Error('Missing required options for ProovdPulse initialization');
        }
        this.socketClient = new PulseSocketClient(this.options.clientId, this.options.websiteId, this.options.serverUrl, {
            secure: this.options.secure,
            debug: this.options.debug,
            reconnectMaxAttempts: this.options.reconnectMaxAttempts,
            reconnectDelay: this.options.reconnectDelay
        });
        // Handle stats updates
        this.socketClient.on('stats', (data) => {
            if (data.websiteId === this.options.websiteId) {
                this.updateWidgets({
                    type: 'viewers',
                    count: data.activeUsers || 0
                });
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
            // Create widget container
            await this.createContainer();
            // Initialize enabled widgets
            if (this.widgetsContainer) {
                widgetRegistry.setContainer(this.widgetsContainer);
                widgetRegistry.initialize(this.options.widgets || []);
            }
            // Connect to socket server
            await this.socketClient.connect();
            // Start tracking activity
            this.startTracking();
            this.log('Initialized successfully');
        }
        catch (error) {
            console.error('ProovdPulse: Failed to initialize', error);
            throw error;
        }
    }
    /**
     * Create container for widgets
     */
    async createContainer() {
        return new Promise((resolve, reject) => {
            try {
                // Get container element
                if (typeof this.options.container === 'string') {
                    const containerElement = document.querySelector(this.options.container);
                    if (!containerElement) {
                        throw new Error(`ProovdPulse: Container element "${this.options.container}" not found`);
                    }
                    this.container = containerElement;
                }
                else if (this.options.container) {
                    this.container = this.options.container;
                }
                else {
                    throw new Error('ProovdPulse: No container specified');
                }
                // Create a wrapper element
                const wrapper = document.createElement('div');
                wrapper.className = 'proovd-pulse-wrapper';
                // Use shadow DOM if enabled and supported
                if (this.options.shadowDOM && this.container && typeof this.container.attachShadow === 'function') {
                    this.shadow = wrapper.attachShadow({ mode: 'open' });
                    // Create style element for shadow DOM
                    const style = document.createElement('style');
                    style.textContent = `
            :host {
              all: initial;
            }
            .proovd-pulse-widgets-container {
              position: relative;
              width: 100%;
              height: 100%;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              font-size: 14px;
              line-height: 1.5;
              color: #333;
            }
          `;
                    this.shadow.appendChild(style);
                    // Create container for widgets
                    this.widgetsContainer = document.createElement('div');
                    this.widgetsContainer.className = 'proovd-pulse-widgets-container';
                    this.shadow.appendChild(this.widgetsContainer);
                }
                else {
                    // Create container for widgets without shadow DOM
                    this.widgetsContainer = document.createElement('div');
                    this.widgetsContainer.className = 'proovd-pulse-widgets-container';
                    this.widgetsContainer.style.position = 'relative';
                    this.widgetsContainer.style.width = '100%';
                    this.widgetsContainer.style.height = '100%';
                    wrapper.appendChild(this.widgetsContainer);
                }
                // Add wrapper to container
                if (this.container) {
                    this.container.appendChild(wrapper);
                }
                resolve();
            }
            catch (error) {
                reject(error);
            }
        });
    }
    /**
     * Update widgets with new data
     */
    updateWidgets(data) {
        widgetRegistry.update(data);
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
     * Enable a widget
     */
    enableWidget(type, options) {
        if (!widgetRegistry.hasWidgetType(type)) {
            console.error(`ProovdPulse: Widget type '${type}' not registered`);
            return;
        }
        // Find existing widget config
        const existingIndex = this.options.widgets.findIndex(w => w.type === type);
        if (existingIndex >= 0) {
            // Update existing widget
            this.options.widgets[existingIndex].enabled = true;
            if (options) {
                this.options.widgets[existingIndex].options = {
                    ...this.options.widgets[existingIndex].options,
                    ...options
                };
            }
        }
        else {
            // Add new widget
            this.options.widgets.push({
                type,
                enabled: true,
                options
            });
        }
        // Reinitialize widgets
        widgetRegistry.initialize(this.options.widgets);
    }
    /**
     * Disable a widget
     */
    disableWidget(type) {
        // Find existing widget config
        const existingIndex = this.options.widgets.findIndex(w => w.type === type);
        if (existingIndex >= 0) {
            // Update existing widget
            this.options.widgets[existingIndex].enabled = false;
            // Reinitialize widgets
            widgetRegistry.initialize(this.options.widgets);
        }
    }
    /**
     * Configure a widget
     */
    configureWidget(type, options) {
        // Find existing widget config
        const existingIndex = this.options.widgets.findIndex(w => w.type === type);
        if (existingIndex >= 0) {
            // Update existing widget
            this.options.widgets[existingIndex].options = {
                ...this.options.widgets[existingIndex].options,
                ...options
            };
            // Reinitialize widgets if enabled
            if (this.options.widgets[existingIndex].enabled) {
                widgetRegistry.initialize(this.options.widgets);
            }
        }
        else {
            // Add new widget (disabled by default)
            this.options.widgets.push({
                type,
                enabled: false,
                options
            });
        }
    }
    /**
     * Simulate a purchase notification
     */
    simulatePurchase(productName, location) {
        this.updateWidgets({
            type: 'purchases',
            productName,
            timestamp: new Date(),
            location
        });
    }
    /**
     * Update stock status
     */
    updateStock(productId, currentStock, initialStock) {
        this.updateWidgets({
            type: 'stock',
            productId,
            currentStock,
            initialStock
        });
    }
    /**
     * Show countdown timer
     */
    showCountdown(endTime, message) {
        this.updateWidgets({
            type: 'countdown',
            endTime,
            message
        });
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
        // Clean up widgets
        widgetRegistry.cleanUp();
        // Remove container
        if (this.container && this.widgetsContainer && this.widgetsContainer.parentNode) {
            const wrapper = this.widgetsContainer.parentNode;
            if (wrapper.parentNode) {
                wrapper.parentNode.removeChild(wrapper);
            }
        }
        this.container = null;
        this.widgetsContainer = null;
        this.shadow = null;
        this.log('Destroyed');
    }
    /**
     * Get or create a client ID
     */
    getClientId() {
        let clientId = localStorage.getItem('proovdPulseClientId');
        if (!clientId) {
            clientId = uuidv4();
            localStorage.setItem('proovdPulseClientId', clientId);
        }
        return clientId;
    }
    /**
     * Log message if debug is enabled
     */
    log(message, ...args) {
        if (this.options.debug) {
            console.log(`ProovdPulse: ${message}`, ...args);
        }
    }
}
