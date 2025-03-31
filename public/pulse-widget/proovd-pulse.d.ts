import { WidgetConfig } from './widget-registry';
interface ProovdPulseOptions {
    websiteId: string;
    serverUrl?: string;
    clientId?: string;
    secure?: boolean;
    debug?: boolean;
    reconnectMaxAttempts?: number;
    reconnectDelay?: number;
    container?: string | HTMLElement;
    widgets?: WidgetConfig[];
    theme?: 'light' | 'dark' | 'auto';
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    shadowDOM?: boolean;
}
export declare class ProovdPulse {
    private socketClient;
    private options;
    private metrics;
    private isTracking;
    private startTime;
    private activityInterval;
    private maxScrollPercentage;
    private clickHandler;
    private scrollHandler;
    private isProduction;
    private reconnectAttempts;
    private maxReconnectAttempts;
    private container;
    private shadow;
    private widgetsContainer;
    constructor(options: ProovdPulseOptions);
    /**
     * Initialize the widget
     */
    init(): Promise<void>;
    /**
     * Create container for widgets
     */
    private createContainer;
    /**
     * Update widgets with new data
     */
    private updateWidgets;
    /**
     * Start tracking user activity
     */
    private startTracking;
    /**
     * Report current activity metrics
     */
    reportActivity(): void;
    /**
     * Enable a widget
     */
    enableWidget(type: string, options?: Record<string, any>): void;
    /**
     * Disable a widget
     */
    disableWidget(type: string): void;
    /**
     * Configure a widget
     */
    configureWidget(type: string, options: Record<string, any>): void;
    /**
     * Simulate a purchase notification
     */
    simulatePurchase(productName: string, location?: string): void;
    /**
     * Update stock status
     */
    updateStock(productId: string, currentStock: number, initialStock?: number): void;
    /**
     * Show countdown timer
     */
    showCountdown(endTime: number | string, message?: string): void;
    /**
     * Destroy the widget and clean up
     */
    destroy(): void;
    /**
     * Get or create a client ID
     */
    private getClientId;
    /**
     * Log message if debug is enabled
     */
    private log;
}
export {};
