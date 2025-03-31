/**
 * Widget Interface
 * Base interface that all ProovdPulse widgets must implement
 */
/**
 * Base class for widgets that implements common functionality
 */
export class BaseWidget {
    constructor(options = {}) {
        this.element = null;
        this.container = null;
        this.options = {
            position: 'bottom-right',
            theme: 'light',
            animations: true,
            zIndex: 9999,
            ...options
        };
    }
    /**
     * Mount the widget to the DOM
     */
    mount() {
        if (!this.container) {
            console.error('Widget container is not set.');
            return;
        }
        // Create the element if it doesn't exist
        if (!this.element) {
            this.element = this.createElement();
            // Apply base styles
            this.applyBaseStyles();
            // Add to container
            this.container.appendChild(this.element);
        }
        // Call initialize method
        this.initialize();
    }
    /**
     * Initialize the widget
     * This is called after the element is created and added to the DOM
     */
    initialize() {
        // Override in subclasses if needed
    }
    /**
     * Apply base styles to the widget element
     */
    applyBaseStyles() {
        if (!this.element)
            return;
        // Apply position
        this.element.style.position = 'absolute';
        switch (this.options.position) {
            case 'top-left':
                this.element.style.top = '20px';
                this.element.style.left = '20px';
                break;
            case 'top-right':
                this.element.style.top = '20px';
                this.element.style.right = '20px';
                break;
            case 'bottom-left':
                this.element.style.bottom = '20px';
                this.element.style.left = '20px';
                break;
            case 'bottom-right':
            default:
                this.element.style.bottom = '20px';
                this.element.style.right = '20px';
                break;
        }
        // Apply z-index
        if (this.options.zIndex !== undefined) {
            this.element.style.zIndex = this.options.zIndex.toString();
        }
        // Apply theme
        this.element.dataset.theme = this.options.theme;
        // Apply animations
        if (this.options.animations === false) {
            this.element.dataset.animations = 'false';
        }
        // Apply custom class name
        if (this.options.className) {
            this.element.classList.add(this.options.className);
        }
        // Apply custom inline styles
        if (this.options.style) {
            Object.assign(this.element.style, this.options.style);
        }
    }
    /**
     * Unmount the widget from the DOM
     */
    unmount() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
    }
}
