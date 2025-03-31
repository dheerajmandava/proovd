/**
 * ProovdPulse WebSocket Client
 * Handles communication with the ProovdPulse WebSocket server
 */
interface PulseMetrics {
    clickCount: number;
    scrollPercentage: number;
    timeOnPage: number;
}
interface PulseOptions {
    clientId: string;
    websiteId: string;
    serverUrl: string;
    secure?: boolean;
    reconnectMaxAttempts?: number;
    reconnectDelay?: number;
    debug?: boolean;
}
type MessageHandler = (data: any) => void;
export declare class PulseSocketClient {
    private socket;
    private options;
    private reconnectAttempts;
    private reconnectTimeout;
    private handlers;
    private isConnected;
    private pingInterval;
    private lastPongTime;
    constructor(clientId: string, websiteId: string, serverUrl: string, options?: Partial<PulseOptions>);
    /**
     * Connect to the WebSocket server
     */
    connect(): Promise<void>;
    /**
     * Send activity metrics to the server
     */
    sendActivity(metrics: PulseMetrics): void;
    /**
     * Send a ping to keep the connection alive
     */
    private sendPing;
    /**
     * Start the ping interval
     */
    private startPingInterval;
    /**
     * Stop the ping interval
     */
    private stopPingInterval;
    /**
     * Send a leave message and close the connection
     */
    disconnect(): void;
    /**
     * Force a reconnection
     */
    reconnect(): void;
    /**
     * Register a handler for a specific message type
     */
    on(type: 'stats' | 'connect' | 'disconnect' | 'error', handler: MessageHandler): void;
    /**
     * Unregister a handler for a specific message type
     */
    off(type: 'stats' | 'connect' | 'disconnect' | 'error', handler: MessageHandler): void;
    /**
     * Check if the socket is currently active and able to send messages
     */
    isActive(): boolean;
    /**
     * Send a message to the server
     */
    private sendMessage;
    /**
     * Notify all registered handlers for a specific message type
     */
    private notifyHandlers;
    /**
     * Attempt to reconnect to the server with exponential backoff
     */
    private attemptReconnect;
    /**
     * Build the WebSocket URL with query parameters
     */
    private buildWebSocketUrl;
    /**
     * Log a message to the console if debugging is enabled
     */
    private log;
}
export {};
