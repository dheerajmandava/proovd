/**
 * ProovdPulse UI Component
 * Controls the display of the ProovdPulse widget UI
 */
export interface PulseUIOptions {
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    theme?: 'light' | 'dark' | 'auto';
    showActiveUsers?: boolean;
    showIcon?: boolean;
    customCSS?: string;
    zIndex?: number;
    debug?: boolean;
}
export declare class PulseWidget {
    private socketClient;
    private container;
    private options;
    private activeUsers;
    private websiteId;
    private clientId;
    private serverUrl;
    /**
     * Create a new PulseWidget instance
     */
    constructor(clientId: string, websiteId: string, serverUrl: string, options?: PulseUIOptions);
    /**
     * Connect to the socket server and initialize the UI
     */
    connect(): Promise<void>;
    /**
     * Initialize the UI
     */
    private initUI;
    /**
     * Update the UI with the latest data
     */
    private updateUI;
    /**
     * Add the required styles to the document
     */
    private addStyles;
    /**
     * Handle stats update from the socket server
     */
    private handleStatsUpdate;
    /**
     * Handle socket connection
     */
    private handleConnect;
    /**
     * Handle socket disconnection
     */
    private handleDisconnect;
    /**
     * Handle socket error
     */
    private handleError;
    /**
     * Destroy the widget instance
     */
    destroy(): void;
}
