/**
 * ProovdPulse Purchase Notification Widget
 * ---------------------------------------
 * Shows recent purchase notifications as toast messages
 */
import { BaseWidget, BaseWidgetOptions } from './widget-interface';
export interface PurchaseNotificationOptions extends BaseWidgetOptions {
    /**
     * Maximum number of notifications to show at once
     */
    maxNotifications?: number;
    /**
     * How long to show each notification (milliseconds)
     */
    displayTime?: number;
    /**
     * Whether to show the time ago
     */
    showTimeAgo?: boolean;
    /**
     * Whether to show the location
     */
    showLocation?: boolean;
    /**
     * Template for the notification message
     * Available variables: {{name}}, {{location}}, {{timeAgo}}
     */
    template?: string;
    /**
     * Notification background color
     */
    backgroundColor?: string;
    /**
     * Text color
     */
    textColor?: string;
    /**
     * Accent color (for borders, icons)
     */
    accentColor?: string;
    /**
     * Whether to include product image if available
     */
    showProductImage?: boolean;
    /**
     * Animation style for entrance/exit
     */
    animationStyle?: 'slide' | 'fade' | 'pop';
    /**
     * Queue behavior when multiple purchases come in
     */
    queueBehavior?: 'replace' | 'stack';
    /**
     * Distance between stacked notifications (in pixels)
     */
    stackGap?: number;
}
interface PurchaseData {
    productName: string;
    location?: string;
    timestamp: Date | string;
    image?: string;
    productId?: string;
    productUrl?: string;
    price?: string | number;
    currency?: string;
}
export declare class PurchaseNotification extends BaseWidget {
    protected options: PurchaseNotificationOptions;
    private notifications;
    private notificationQueue;
    private isProcessingQueue;
    constructor(options?: PurchaseNotificationOptions);
    /**
     * Create the widget element
     */
    protected createElement(): HTMLElement;
    /**
     * Update the widget with new purchase data
     */
    update(data: PurchaseData): void;
    /**
     * Process notifications in the queue
     */
    private processQueue;
    /**
     * Create and show a notification
     */
    private showNotification;
    /**
     * Remove a notification
     */
    private removeNotification;
    /**
     * Apply entrance animation based on style
     */
    private applyEntranceAnimation;
    /**
     * Apply exit animation based on style
     */
    private applyExitAnimation;
    /**
     * Apply template to data
     */
    private applyTemplate;
    /**
     * Format time ago
     */
    private formatTimeAgo;
    /**
     * Unmount the widget
     */
    unmount(): void;
}
export {};
