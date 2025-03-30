/**
 * ProovdPulse WebSocket Client
 * Handles communication with the ProovdPulse WebSocket server
 */
export class PulseSocketClient {
    constructor(clientId, websiteId, serverUrl) {
        this.socket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectTimeout = null;
        this.handlers = {
            stats: [],
            connect: [],
            disconnect: [],
            error: []
        };
        this.isConnected = false;
        this.clientId = clientId;
        this.websiteId = websiteId;
        this.serverUrl = serverUrl;
    }
    /**
     * Connect to the WebSocket server
     */
    connect() {
        return new Promise((resolve, reject) => {
            try {
                this.socket = new WebSocket(this.serverUrl);
                this.socket.onopen = () => {
                    console.log('ProovdPulse: Connected to WebSocket server');
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    // Send join message
                    this.sendMessage('join', {
                        clientId: this.clientId,
                        websiteId: this.websiteId
                    });
                    // Notify handlers
                    this.notifyHandlers('connect', { connected: true });
                    resolve();
                };
                this.socket.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        if (data.type === 'stats') {
                            this.notifyHandlers('stats', data);
                        }
                    }
                    catch (error) {
                        console.error('ProovdPulse: Error parsing message', error);
                    }
                };
                this.socket.onclose = () => {
                    console.log('ProovdPulse: Connection closed');
                    this.isConnected = false;
                    this.notifyHandlers('disconnect', { connected: false });
                    // Try to reconnect
                    this.attemptReconnect();
                };
                this.socket.onerror = (error) => {
                    console.error('ProovdPulse: WebSocket error', error);
                    this.notifyHandlers('error', { error });
                    reject(error);
                };
            }
            catch (error) {
                console.error('ProovdPulse: Failed to connect', error);
                this.notifyHandlers('error', { error });
                reject(error);
            }
        });
    }
    /**
     * Send activity metrics to the server
     */
    sendActivity(metrics) {
        this.sendMessage('activity', {
            clientId: this.clientId,
            websiteId: this.websiteId,
            metrics
        });
    }
    /**
     * Send a leave message and close the connection
     */
    disconnect() {
        if (this.socket && this.isConnected) {
            this.sendMessage('leave', {
                clientId: this.clientId,
                websiteId: this.websiteId
            });
            this.socket.close();
        }
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
    }
    /**
     * Register a handler for a specific message type
     */
    on(type, handler) {
        if (!this.handlers[type]) {
            this.handlers[type] = [];
        }
        this.handlers[type].push(handler);
    }
    /**
     * Remove a handler for a specific message type
     */
    off(type, handler) {
        if (this.handlers[type]) {
            this.handlers[type] = this.handlers[type].filter(h => h !== handler);
        }
    }
    /**
     * Check if the connection is active
     */
    isActive() {
        var _a;
        return this.isConnected && ((_a = this.socket) === null || _a === void 0 ? void 0 : _a.readyState) === WebSocket.OPEN;
    }
    /**
     * Send a message to the server
     */
    sendMessage(type, data) {
        if (this.socket && this.isConnected) {
            try {
                this.socket.send(JSON.stringify({
                    type,
                    ...data
                }));
            }
            catch (error) {
                console.error('ProovdPulse: Error sending message', error);
            }
        }
        else {
            console.warn('ProovdPulse: Cannot send message, not connected');
        }
    }
    /**
     * Notify all handlers of a specific type
     */
    notifyHandlers(type, data) {
        if (this.handlers[type]) {
            this.handlers[type].forEach(handler => {
                try {
                    handler(data);
                }
                catch (error) {
                    console.error(`ProovdPulse: Error in ${type} handler`, error);
                }
            });
        }
    }
    /**
     * Attempt to reconnect to the server
     */
    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('ProovdPulse: Max reconnect attempts reached');
            return;
        }
        this.reconnectAttempts++;
        const delay = Math.min(1000 * this.reconnectAttempts, 5000); // Exponential backoff up to 5 seconds
        console.log(`ProovdPulse: Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
        this.reconnectTimeout = setTimeout(() => {
            this.connect().catch(error => {
                console.error('ProovdPulse: Reconnect failed', error);
            });
        }, delay);
    }
}
