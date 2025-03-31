/**
 * Urgency Indicator Widget
 * Shows time-based countdowns and urgency messages
 */
import { BaseWidget, BaseWidgetOptions } from './widget-interface';
export interface UrgencyIndicatorOptions extends BaseWidgetOptions {
    /**
     * Type of urgency to display
     */
    type?: 'countdown' | 'limited-time' | 'hot-item';
    /**
     * Text to display before the countdown/message
     */
    prefix?: string;
    /**
     * Text to display after the countdown/message
     */
    suffix?: string;
    /**
     * Show days in countdown
     */
    showDays?: boolean;
    /**
     * Show hours in countdown
     */
    showHours?: boolean;
    /**
     * Show minutes in countdown
     */
    showMinutes?: boolean;
    /**
     * Show seconds in countdown
     */
    showSeconds?: boolean;
    /**
     * Format for countdown display
     * Placeholders: {d} days, {h} hours, {m} minutes, {s} seconds
     */
    countdownFormat?: string;
    /**
     * Message to display when countdown ends
     */
    endMessage?: string;
    /**
     * Background color
     */
    backgroundColor?: string;
    /**
     * Text color
     */
    textColor?: string;
    /**
     * Add pulse animation
     */
    pulseAnimation?: boolean;
    /**
     * Add flashing effect when time is running out
     */
    flashWhenEnding?: boolean;
    /**
     * Threshold in seconds for "time running out" effects
     */
    endingSoonThreshold?: number;
    /**
     * Product selector for page with multiple products
     */
    productSelector?: string;
    /**
     * Data attribute for product ID
     */
    productIdAttribute?: string;
}
interface UrgencyData {
    productId?: string;
    type: 'countdown' | 'limited-time' | 'hot-item';
    endTime?: number | string;
    message?: string;
    viewCount?: number;
    purchaseCount?: number;
}
export declare class UrgencyIndicator extends BaseWidget {
    protected options: UrgencyIndicatorOptions;
    private countdownIntervals;
    private urgencyData;
    private productIndicators;
    private globalEndTime;
    private defaultId;
    private observer;
    constructor(options?: UrgencyIndicatorOptions);
    /**
     * Create the widget element
     */
    protected createElement(): HTMLElement;
    /**
     * Initialize the widget
     */
    protected initialize(): void;
    /**
     * Handle DOM changes to find new products
     */
    private handleDOMChanges;
    /**
     * Find product elements on the page
     */
    private findProductElements;
    /**
     * Set up global indicator
     */
    private setupGlobalIndicator;
    /**
     * Update the widget with new urgency data
     */
    update(data: UrgencyData): void;
    /**
     * Update an indicator element with urgency data
     */
    private updateIndicator;
    /**
     * Set up countdown timer
     */
    private setupCountdown;
    /**
     * Get time left in seconds
     */
    private getTimeLeft;
    /**
     * Format countdown time
     */
    private formatCountdown;
    /**
     * Add pulse animation to element
     */
    private addPulseAnimation;
    /**
     * Add flashing effect to element
     */
    private addFlashingEffect;
    /**
     * Remove flashing effect from element
     */
    private removeFlashingEffect;
    /**
     * Unmount the widget
     */
    unmount(): void;
}
export {};
