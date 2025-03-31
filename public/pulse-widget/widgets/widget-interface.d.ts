/**
 * Widget Interface
 * Base interface that all ProovdPulse widgets must implement
 */
export interface WidgetInterface {
    /**
     * Mount the widget to the DOM
     * This is called when the widget is initialized
     */
    mount(): void;
    /**
     * Update the widget with new data
     * @param data The data to update the widget with
     */
    update(data: any): void;
    /**
     * Unmount the widget from the DOM
     * This is called when the widget is disabled or destroyed
     */
    unmount(): void;
}
export interface BaseWidgetOptions {
    /**
     * The position of the widget
     */
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    /**
     * The theme of the widget
     */
    theme?: 'light' | 'dark' | 'auto';
    /**
     * Enable animations
     */
    animations?: boolean;
    /**
     * Z-index for the widget
     */
    zIndex?: number;
    /**
     * Custom CSS class to add to the widget
     */
    className?: string;
    /**
     * Custom inline styles to apply to the widget
     */
    style?: Partial<CSSStyleDeclaration>;
}
/**
 * Base class for widgets that implements common functionality
 */
export declare abstract class BaseWidget implements WidgetInterface {
    protected options: BaseWidgetOptions;
    protected element: HTMLElement | null;
    protected container: HTMLElement | null;
    constructor(options?: BaseWidgetOptions);
    /**
     * Mount the widget to the DOM
     */
    mount(): void;
    /**
     * Create the widget element
     * This should be implemented by each widget
     */
    protected abstract createElement(): HTMLElement;
    /**
     * Initialize the widget
     * This is called after the element is created and added to the DOM
     */
    protected initialize(): void;
    /**
     * Apply base styles to the widget element
     */
    protected applyBaseStyles(): void;
    /**
     * Update the widget with new data
     * This should be implemented by each widget
     */
    abstract update(data: any): void;
    /**
     * Unmount the widget from the DOM
     */
    unmount(): void;
}
