/**
 * ProovdPulse Stock Status Widget
 * ------------------------------
 * Shows inventory status and creates urgency
 */
import { WidgetConfig, WidgetInterface } from '../widget-registry';
interface StockData {
    productId: string;
    currentStock: number;
    initialStock?: number;
    soldToday?: number;
}
export declare class StockStatus implements WidgetInterface {
    private container;
    private element;
    private currentStock;
    private config;
    private options;
    constructor(config: WidgetConfig);
    /**
     * Mount the widget to the container
     */
    mount(container: HTMLElement): void;
    /**
     * Update stock data
     */
    update(data: StockData): void;
    /**
     * Show widget with status text
     */
    private showWidget;
    /**
     * Hide the widget
     */
    private hideWidget;
    /**
     * Animate stock change
     */
    private animateStockChange;
    /**
     * Apply pulse animation
     */
    private applyPulseAnimation;
    /**
     * Remove the widget from DOM
     */
    unmount(): void;
    /**
     * Get position styles based on options
     */
    private getPositionStyles;
    /**
     * Apply CSS styles to an element
     */
    private applyStyles;
}
export {};
