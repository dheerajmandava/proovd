import { PulseUIOptions } from './pulse-ui';
interface ProovdPulseOptions extends PulseUIOptions {
    websiteId: string;
    serverUrl: string;
    clientId?: string;
    authToken?: string;
    secure?: boolean;
    debug?: boolean;
    reconnectMaxAttempts?: number;
    reconnectBaseDelay?: number;
    reconnectMaxDelay?: number;
}
export declare class ProovdPulse {
    private socketClient;
    private ui;
    private options;
    private metrics;
    private isTracking;
    private startTime;
    private activityInterval;
    private maxScrollPercentage;
    private clickHandler;
    private scrollHandler;
    private isProduction;
    constructor(options: ProovdPulseOptions);
    /**
     * Initialize the widget
     */
    init(): Promise<void>;
    /**
     * Start tracking user activity
     */
    private startTracking;
    /**
     * Report current activity metrics
     */
    reportActivity(): void;
    /**
     * Destroy the widget and clean up
     */
    destroy(): void;
    /**
     * Get or create a client ID
     */
    private getClientId;
    /**
     * Log messages if debug is enabled
     */
    private log;
}
export {};
