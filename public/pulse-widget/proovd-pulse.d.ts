import { PulseUIOptions } from './pulse-ui';
interface ProovdPulseOptions extends PulseUIOptions {
    websiteId: string;
    serverUrl: string;
    clientId?: string;
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
    private reportActivity;
    /**
     * Destroy the widget and clean up
     */
    destroy(): void;
    /**
     * Get or create a client ID
     */
    private getClientId;
}
export {};
