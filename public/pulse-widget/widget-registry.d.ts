/**
 * ProovdPulse Widget Registry
 * --------------------------
 * Centralized registry for all available notification widgets
 */
export interface WidgetConfig {
    type: string;
    enabled: boolean;
    options?: Record<string, any>;
}
export interface WidgetInterface {
    mount(container: HTMLElement): void;
    unmount(): void;
    update(data: any): void;
}
export type WidgetConstructor = new (config: any) => WidgetInterface;
/**
 * Widget Registry
 * Manages available widgets and their configurations
 */
declare class WidgetRegistry {
    private registry;
    private instances;
    private activeWidgets;
    private container;
    constructor();
    /**
     * Register a new widget type
     */
    register(type: string, constructor: WidgetConstructor): void;
    /**
     * Set the container element for widgets
     */
    setContainer(container: HTMLElement): void;
    /**
     * Initialize widgets based on configuration
     */
    initialize(configs: WidgetConfig[]): void;
    /**
     * Update data for all active widgets or a specific widget
     */
    update(data: any, widgetType?: string): void;
    /**
     * Clean up all widget instances
     */
    cleanUp(): void;
    /**
     * Get a list of available widget types
     */
    getAvailableWidgetTypes(): string[];
    /**
     * Check if a widget type is registered
     */
    hasWidgetType(type: string): boolean;
    /**
     * Get active widget types
     */
    getActiveWidgetTypes(): string[];
}
export declare const widgetRegistry: WidgetRegistry;
export {};
