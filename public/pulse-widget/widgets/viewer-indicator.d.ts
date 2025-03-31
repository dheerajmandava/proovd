/**
 * Viewer Indicator Widget
 * Shows how many people are currently viewing the website or product
 */
import { BaseWidget, BaseWidgetOptions } from './widget-interface';
export interface ViewerIndicatorOptions extends BaseWidgetOptions {
    /**
     * Minimum viewers to show the widget
     */
    minViewers?: number;
    /**
     * Maximum viewers to show (caps display)
     */
    maxViewers?: number;
    /**
     * Text to display before the count
     */
    prefix?: string;
    /**
     * Text to display after the count
     */
    suffix?: string;
    /**
     * Show singular/plural form
     */
    smartText?: boolean;
    /**
     * Singular form of the viewer text
     */
    singularText?: string;
    /**
     * Plural form of the viewer text
     */
    pluralText?: string;
    /**
     * Show the pulsing dot animation
     */
    showPulse?: boolean;
    /**
     * Text color
     */
    textColor?: string;
    /**
     * Background color
     */
    backgroundColor?: string;
    /**
     * Pulse dot color
     */
    pulseColor?: string;
    /**
     * Automatically hide after timeout (ms)
     */
    autoHideAfter?: number;
    /**
     * Enable hover expansion
     */
    expandOnHover?: boolean;
    /**
     * Product selector for page with multiple products
     */
    productSelector?: string;
    /**
     * Position relative to product when productSelector is used
     */
    productPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}
export declare class ViewerIndicator extends BaseWidget {
    protected options: ViewerIndicatorOptions;
    private count;
    private hideTimeout;
    private productElements;
    private productIndicators;
    constructor(options?: ViewerIndicatorOptions);
    /**
     * Create the widget element
     */
    protected createElement(): HTMLElement;
    /**
     * Initialize the widget
     */
    protected initialize(): void;
    /**
     * Find product elements on the page
     */
    private findProductElements;
    /**
     * Create an indicator for a specific product element
     */
    private createProductIndicator;
    /**
     * Update the widget with new data
     */
    update(data: any): void;
    /**
     * Update the text in an indicator element
     */
    private updateIndicatorText;
    /**
     * Unmount the widget
     */
    unmount(): void;
}
