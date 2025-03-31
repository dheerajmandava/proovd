/**
 * ProovdPulse Widget Registry
 * --------------------------
 * Centralized registry for all available notification widgets
 */

import { ViewerIndicator } from './widgets/viewer-indicator';
import { PurchaseNotification } from './widgets/purchase-notification';
import { StockStatus } from './widgets/stock-status';
import { UrgencyIndicator } from './widgets/urgency-indicator';
import { AnalyticsWidget } from './widgets/analytics-widget';

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

// Updated WidgetConstructor to be more flexible with parameter types
export type WidgetConstructor = new (config: any) => WidgetInterface;

/**
 * Widget Registry
 * Manages available widgets and their configurations
 */
class WidgetRegistry {
  private registry: Map<string, WidgetConstructor> = new Map();
  private instances: Map<string, WidgetInterface> = new Map();
  private activeWidgets: string[] = [];
  private container: HTMLElement | null = null;

  constructor() {
    // Register built-in widgets
    this.register('viewers', ViewerIndicator);
    this.register('purchases', PurchaseNotification);
    this.register('stock', StockStatus);
    this.register('urgency', UrgencyIndicator);
    this.register('analytics', AnalyticsWidget);
    
    // Expose container for global access (used by widgets)
    if (typeof window !== 'undefined') {
      (window as any).widgetRegistryContainer = this.container;
    }
  }

  /**
   * Register a new widget type
   */
  register(type: string, constructor: WidgetConstructor): void {
    if (this.registry.has(type)) {
      console.warn(`ProovdPulse: Widget type '${type}' is already registered. Overwriting.`);
    }
    this.registry.set(type, constructor);
  }

  /**
   * Set the container element for widgets
   */
  setContainer(container: HTMLElement): void {
    this.container = container;
    
    // Update global container reference
    if (typeof window !== 'undefined') {
      (window as any).widgetRegistryContainer = this.container;
    }
    
    // Re-mount active widgets if container changed
    if (this.instances.size > 0) {
      this.activeWidgets.forEach(type => {
        const instance = this.instances.get(type);
        if (instance && this.container) {
          instance.mount(this.container);
        }
      });
    }
  }

  /**
   * Initialize widgets based on configuration
   */
  initialize(configs: WidgetConfig[]): void {
    // Clean up any existing widgets
    this.cleanUp();
    
    if (!this.container) {
      console.error('ProovdPulse: Cannot initialize widgets without a container');
      return;
    }

    // Create instances for enabled widgets
    configs.forEach(config => {
      if (config.enabled && this.registry.has(config.type)) {
        try {
          const Constructor = this.registry.get(config.type)!;
          const instance = new Constructor(config);
          this.instances.set(config.type, instance);
          this.activeWidgets.push(config.type);
          
          // Mount the widget
          instance.mount(this.container!);
        } catch (error) {
          console.error(`ProovdPulse: Failed to initialize widget '${config.type}'`, error);
        }
      }
    });
  }

  /**
   * Update data for all active widgets or a specific widget
   */
  update(data: any, widgetType?: string): void {
    if (widgetType && this.instances.has(widgetType)) {
      // Update specific widget
      const instance = this.instances.get(widgetType);
      if (instance) {
        instance.update(data);
      }
    } else {
      // Update all active widgets
      this.activeWidgets.forEach(type => {
        const instance = this.instances.get(type);
        if (instance) {
          instance.update(data);
        }
      });
    }
  }

  /**
   * Clean up all widget instances
   */
  cleanUp(): void {
    this.activeWidgets.forEach(type => {
      const instance = this.instances.get(type);
      if (instance) {
        instance.unmount();
      }
    });
    
    this.instances.clear();
    this.activeWidgets = [];
  }

  /**
   * Get a list of available widget types
   */
  getAvailableWidgetTypes(): string[] {
    return Array.from(this.registry.keys());
  }

  /**
   * Check if a widget type is registered
   */
  hasWidgetType(type: string): boolean {
    return this.registry.has(type);
  }

  /**
   * Get active widget types
   */
  getActiveWidgetTypes(): string[] {
    return [...this.activeWidgets];
  }
}

// Export singleton instance
export const widgetRegistry = new WidgetRegistry(); 