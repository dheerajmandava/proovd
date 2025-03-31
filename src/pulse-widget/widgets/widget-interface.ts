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
export abstract class BaseWidget implements WidgetInterface {
  protected options: BaseWidgetOptions;
  protected element: HTMLElement | null = null;
  protected container: HTMLElement | null = null;
  
  constructor(options: BaseWidgetOptions = {}) {
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
  mount(): void {
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
   * Create the widget element
   * This should be implemented by each widget
   */
  protected abstract createElement(): HTMLElement;
  
  /**
   * Initialize the widget
   * This is called after the element is created and added to the DOM
   */
  protected initialize(): void {
    // Override in subclasses if needed
  }
  
  /**
   * Apply base styles to the widget element
   */
  protected applyBaseStyles(): void {
    if (!this.element) return;
    
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
   * Update the widget with new data
   * This should be implemented by each widget
   */
  abstract update(data: any): void;
  
  /**
   * Unmount the widget from the DOM
   */
  unmount(): void {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    
    this.element = null;
  }
} 