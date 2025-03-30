/**
 * PulseSocketClient
 * Handles WebSocket communication for the ProovdPulse widget
 */
export class PulseSocketClient {
    /**
     * Constructor
     * @param config Configuration for the socket client
     */
    constructor(config) {
        this.socket = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectInterval = 3000; // 3 seconds
        this.activeUsersCallback = null;
        this.messageQueue = [];
        this.pingInterval = null;
        this.config = config;
    }
    /**
     * Connect to the WebSocket server
     * @returns Promise that resolves when connected
     */
    connect() {
        if (this.socket && this.isConnected) {
            return Promise.resolve();
        }
        return new Promise((resolve, reject) => {
            try {
                const url = this.getSocketUrl();
                console.log('ProovdPulse: Connecting to WebSocket server at', url);
                this.socket = new WebSocket(url);
                // Connection opened
                this.socket.addEventListener('open', () => {
                    console.log('ProovdPulse: Connected to WebSocket server');
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    // Set up ping interval to keep connection alive
                    this.setupPingInterval();
                    // Process any queued messages
                    this.processQueue();
                    resolve();
                });
                // Connection error
                this.socket.addEventListener('error', (event) => {
                    console.error('ProovdPulse: WebSocket connection error:', event);
                    this.isConnected = false;
                    if (this.reconnectAttempts === 0) {
                        reject(new Error('WebSocket connection error'));
                    }
                });
                // Connection closed
                this.socket.addEventListener('close', () => {
                    console.log('ProovdPulse: WebSocket connection closed');
                    this.isConnected = false;
                    this.clearPingInterval();
                    // Attempt to reconnect
                    if (this.reconnectAttempts < this.maxReconnectAttempts) {
                        this.reconnectAttempts++;
                        setTimeout(() => {
                            console.log(`ProovdPulse: Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
                            this.connect().catch(() => {
                                console.error('ProovdPulse: Reconnection attempt failed');
                            });
                        }, this.reconnectInterval * this.reconnectAttempts);
                    }
                });
                // Listen for messages
                this.socket.addEventListener('message', (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        console.log('ProovdPulse: Received message:', data);
                        // Handle active users update
                        if (data.type === 'stats' && data.websiteId === this.config.websiteId) {
                            const activeUsers = data.activeUsers || 0;
                            if (this.activeUsersCallback) {
                                this.activeUsersCallback(activeUsers);
                            }
                        }
                        // Handle server pong
                        if (data.type === 'pong') {
                            console.log('ProovdPulse: Received pong from server');
                        }
                    }
                    catch (error) {
                        console.error('ProovdPulse: Error parsing message:', error);
                    }
                });
            }
            catch (error) {
                console.error('ProovdPulse: Error connecting to WebSocket server:', error);
                reject(error);
            }
        });
    }
    /**
     * Disconnect from the WebSocket server
     */
    disconnect() {
        this.clearPingInterval();
        if (this.socket) {
            // Send leave message before closing
            this.sendLeaveMessage(this.config.websiteId);
            this.socket.close();
            this.socket = null;
        }
        this.isConnected = false;
    }
    /**
     * Check if currently connected to the server
     * @returns Connection status
     */
    getConnectionStatus() {
        return this.isConnected;
    }
    /**
     * Send join message to the server
     * @param clientId Client ID to join with
     */
    sendJoinMessage(clientId) {
        const message = {
            type: 'join',
            clientId,
            websiteId: this.config.websiteId
        };
        this.sendMessage(message);
    }
    /**
     * Send leave message to the server
     * @param clientId Client ID to leave with
     */
    sendLeaveMessage(clientId) {
        const message = {
            type: 'leave',
            clientId,
            websiteId: this.config.websiteId
        };
        this.sendMessage(message);
    }
    /**
     * Send user activity data to the server
     * @param activity User activity data
     */
    sendActivity(activity) {
        // Format the message to match what the server expects
        const message = {
            type: 'activity',
            clientId: activity.sessionId,
            websiteId: this.config.websiteId,
            metrics: {
                clickCount: activity.totalClicks,
                scrollPercentage: activity.scrollDepth,
                timeOnPage: activity.timeOnPage
            }
        };
        this.sendMessage(message);
    }
    /**
     * Send message to the server
     * @param message Message to send
     */
    sendMessage(message) {
        if (!this.socket || !this.isConnected) {
            // Queue message for later
            this.messageQueue.push(message);
            this.connect().catch(err => {
                console.error('ProovdPulse: Failed to connect when sending message:', err);
            });
            return;
        }
        try {
            console.log('ProovdPulse: Sending message:', message);
            this.socket.send(JSON.stringify(message));
        }
        catch (error) {
            console.error('ProovdPulse: Error sending message:', error);
            this.messageQueue.push(message);
        }
    }
    /**
     * Process queued messages
     */
    processQueue() {
        if (this.messageQueue.length === 0 || !this.isConnected) {
            return;
        }
        console.log(`ProovdPulse: Processing ${this.messageQueue.length} queued messages`);
        // Process all queued messages
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            try {
                if (this.socket) {
                    this.socket.send(JSON.stringify(message));
                }
            }
            catch (error) {
                console.error('ProovdPulse: Error sending queued message:', error);
                // Re-queue if sending failed
                this.messageQueue.push(message);
                break;
            }
        }
    }
    /**
     * Set up ping interval to keep connection alive
     */
    setupPingInterval() {
        this.clearPingInterval();
        this.pingInterval = setInterval(() => {
            if (this.isConnected && this.socket) {
                try {
                    this.socket.send(JSON.stringify({ type: 'ping' }));
                }
                catch (error) {
                    console.error('ProovdPulse: Error sending ping:', error);
                }
            }
        }, 30000); // Send ping every 30 seconds
    }
    /**
     * Clear the ping interval
     */
    clearPingInterval() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }
    /**
     * Get complete WebSocket URL with authentication token
     * @returns WebSocket URL with token
     */
    getSocketUrl() {
        // Default to secure WebSocket for production, with fallback for development
        const baseUrl = this.config.socketUrl || 'wss://socket.proovd.in';
        const websiteId = this.config.websiteId;
        const token = this.config.token || '';
        let url = `${baseUrl}?websiteId=${encodeURIComponent(websiteId)}`;
        if (token) {
            url += `&token=${encodeURIComponent(token)}`;
        }
        return url;
    }
    /**
     * Set callback for active users updates
     * @param callback Function to call when active user count changes
     */
    onActiveUsersUpdate(callback) {
        this.activeUsersCallback = callback;
    }
}
