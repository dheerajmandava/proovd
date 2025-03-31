/**
 * ProovdPulse Analytics Widget
 * Provides real-time analytics and data visualization for website engagement metrics
 */
import { WidgetInterface } from './widget-interface';
export interface AnalyticsWidgetOptions {
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'floating';
    theme?: 'light' | 'dark' | 'auto';
    showInactiveUsers?: boolean;
    inactiveThreshold?: number;
    chartType?: 'line' | 'bar' | 'pie';
    metrics?: Array<'viewers' | 'clicks' | 'scrollDepth' | 'timeOnPage' | 'purchases'>;
    refreshInterval?: number;
    showRealTime?: boolean;
    compactView?: boolean;
    dashboardLink?: string;
    customColors?: string[];
}
export declare class AnalyticsWidget implements WidgetInterface {
    private options;
    private container;
    private data;
    private elements;
    private chartInstance;
    private refreshTimer;
    private expanded;
    private chartLibraryLoaded;
    constructor(options?: any);
    /**
     * Mount the widget to the DOM
     */
    mount(): void;
    /**
     * Unmount the widget from the DOM
     */
    unmount(): void;
    /**
     * Update widget with new data
     */
    update(data: any): void;
    /**
     * Clean up resources used by the widget
     */
    destroy(): void;
    /**
     * Render the analytics widget
     */
    private render;
    /**
     * Update the UI with current data
     */
    private updateUI;
    /**
     * Create a metric card
     */
    private createMetricCard;
    /**
     * Update the chart with new data
     */
    private updateChart;
    /**
     * Load chart library dependencies
     */
    private loadDependencies;
    /**
     * Start refresh timer
     */
    private startRefreshTimer;
    /**
     * Refresh data from server
     */
    private refreshData;
    /**
     * Toggle expanded view
     */
    private toggleExpand;
    /**
     * Hide the widget
     */
    private hide;
    /**
     * Format seconds into a readable time string
     */
    private formatTime;
    /**
     * Get CSS styles for the widget
     */
    private getStyles;
}
