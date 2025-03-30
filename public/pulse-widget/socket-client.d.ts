/**
 * ProovdPulse WebSocket Client
 * Handles communication with the ProovdPulse WebSocket server
 */
interface PulseMetrics {
    clickCount: number;
    scrollPercentage: number;
    timeOnPage: number;
}
type MessageHandler = (data: any) => void;
export declare class PulseSocketClient {
    private socket;
    private clientId;
    private websiteId;
    private serverUrl;
    private reconnectAttempts;
    private maxReconnectAttempts;
    private reconnectTimeout;
    private handlers;
    private isConnected;
    constructor(clientId: string, websiteId: string, serverUrl: string);
    /**
     * Connect to the WebSocket server
     */
    connect(): Promise<void>;
    /**
     * Send activity metrics to the server
     */
    sendActivity(metrics: PulseMetrics): void;
    /**
     * Send a leave message and close the connection
     */
    disconnect(): void;
    /**
     * Register a handler for a specific message type
     */
    on(type: 'stats' | 'connect' | 'disconnect' | 'error', handler: MessageHandler): void;
    /**
     * Remove a handler for a specific message type
     */
    off(type: 'stats' | 'connect' | 'disconnect' | 'error', handler: MessageHandler): void;
    /**
     * Check if the connection is active
     */
    isActive(): boolean;
    /**
     * Send a message to the server
     */
    private sendMessage;
    /**
     * Notify all handlers of a specific type
     */
    private notifyHandlers;
    /**
     * Attempt to reconnect to the server
     */
    private attemptReconnect;
}
export {};
