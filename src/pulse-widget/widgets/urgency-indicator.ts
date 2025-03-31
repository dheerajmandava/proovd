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
  endTime?: number | string; // For countdown
  message?: string; // For limited-time and hot-item
  viewCount?: number; // For hot-item
  purchaseCount?: number; // For hot-item
}

export class UrgencyIndicator extends BaseWidget {
  protected options: UrgencyIndicatorOptions;
  private countdownIntervals: Map<string, number> = new Map();
  private urgencyData: Map<string, UrgencyData> = new Map();
  private productIndicators: Map<string, HTMLElement[]> = new Map();
  private globalEndTime: number | null = null;
  private defaultId = 'global';
  private observer: MutationObserver | null = null;

  constructor(options: UrgencyIndicatorOptions = {}) {
    super(options);
    
    this.options = {
      type: 'countdown',
      prefix: '',
      suffix: '',
      showDays: true,
      showHours: true,
      showMinutes: true,
      showSeconds: true,
      countdownFormat: '{d}d {h}h {m}m {s}s',
      endMessage: 'Offer ended',
      backgroundColor: '#ef4444', // Red
      textColor: '#ffffff', // White
      pulseAnimation: true,
      flashWhenEnding: true,
      endingSoonThreshold: 300, // 5 minutes
      productSelector: '[data-product]',
      productIdAttribute: 'data-product-id',
      ...options
    };
  }

  /**
   * Create the widget element
   */
  protected createElement(): HTMLElement {
    const element = document.createElement('div');
    element.className = 'proovd-urgency-indicator';
    
    // Style the element
    element.style.display = 'flex';
    element.style.alignItems = 'center';
    element.style.gap = '8px';
    element.style.padding = '8px 12px';
    element.style.borderRadius = '4px';
    element.style.fontSize = '14px';
    element.style.fontWeight = '600';
    element.style.backgroundColor = this.options.backgroundColor!;
    element.style.color = this.options.textColor!;
    
    // Add pulse animation if enabled
    if (this.options.pulseAnimation) {
      this.addPulseAnimation(element);
    }
    
    return element;
  }

  /**
   * Initialize the widget
   */
  protected initialize(): void {
    if (this.options.productSelector) {
      // Set up observer to detect new products
      this.observer = new MutationObserver(this.handleDOMChanges.bind(this));
      
      this.observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: [this.options.productIdAttribute!]
      });
      
      // Find initial products
      this.findProductElements();
    } else {
      // Set up global indicator
      this.setupGlobalIndicator();
    }
  }

  /**
   * Handle DOM changes to find new products
   */
  private handleDOMChanges(): void {
    this.findProductElements();
  }

  /**
   * Find product elements on the page
   */
  private findProductElements(): void {
    if (!this.options.productSelector) return;
    
    // Find all matching elements
    const elements = Array.from(
      document.querySelectorAll(this.options.productSelector!)
    ) as HTMLElement[];
    
    // Process each element
    for (const element of elements) {
      const productId = element.getAttribute(this.options.productIdAttribute!);
      if (!productId) continue;
      
      // Check if we've already created an indicator for this element
      let hasIndicator = false;
      const indicators = this.productIndicators.get(productId) || [];
      for (const indicator of indicators) {
        if (indicator.parentNode === element) {
          hasIndicator = true;
          break;
        }
      }
      
      if (hasIndicator) continue;
      
      // Create new indicator
      const indicator = this.createElement();
      element.appendChild(indicator);
      
      // Add to our map
      if (!this.productIndicators.has(productId)) {
        this.productIndicators.set(productId, []);
      }
      this.productIndicators.get(productId)!.push(indicator);
      
      // Update with existing data if we have it
      if (this.urgencyData.has(productId)) {
        this.updateIndicator(indicator, this.urgencyData.get(productId)!);
      }
    }
  }

  /**
   * Set up global indicator
   */
  private setupGlobalIndicator(): void {
    if (!this.element) return;
    
    // Add default data if we don't have any
    if (!this.urgencyData.has(this.defaultId)) {
      this.urgencyData.set(this.defaultId, {
        type: this.options.type!,
        message: 'Limited Time Offer'
      });
    }
    
    // Update indicator with data
    this.updateIndicator(this.element, this.urgencyData.get(this.defaultId)!);
  }

  /**
   * Update the widget with new urgency data
   */
  update(data: UrgencyData): void {
    if (!data || !data.type) return;
    
    const id = data.productId || this.defaultId;
    
    // Store urgency data
    this.urgencyData.set(id, data);
    
    // Handle countdown setup
    if (data.type === 'countdown' && data.endTime) {
      this.setupCountdown(id, data.endTime);
    }
    
    // Update indicators
    if (id === this.defaultId && this.element) {
      this.updateIndicator(this.element, data);
    } else if (this.productIndicators.has(id)) {
      this.productIndicators.get(id)!.forEach(indicator => {
        this.updateIndicator(indicator, data);
      });
    }
  }

  /**
   * Update an indicator element with urgency data
   */
  private updateIndicator(indicator: HTMLElement, data: UrgencyData): void {
    let message = '';
    
    // Generate message based on type
    switch (data.type) {
      case 'countdown':
        if (data.endTime) {
          const timeLeft = this.getTimeLeft(data.endTime);
          if (timeLeft <= 0) {
            message = this.options.endMessage!;
          } else {
            message = this.formatCountdown(timeLeft);
            
            // Add flashing effect if ending soon
            if (this.options.flashWhenEnding && timeLeft <= this.options.endingSoonThreshold!) {
              this.addFlashingEffect(indicator);
            } else {
              this.removeFlashingEffect(indicator);
            }
          }
        }
        break;
        
      case 'limited-time':
        message = data.message || 'Limited Time Offer';
        break;
        
      case 'hot-item':
        if (data.viewCount) {
          message = `🔥 ${data.viewCount} people viewing`;
        } else if (data.purchaseCount) {
          message = `🔥 ${data.purchaseCount} sold recently`;
        } else {
          message = data.message || 'Hot Item';
        }
        break;
    }
    
    // Apply prefix and suffix
    const fullMessage = `${this.options.prefix} ${message} ${this.options.suffix}`.trim();
    
    // Update text
    indicator.textContent = fullMessage;
  }

  /**
   * Set up countdown timer
   */
  private setupCountdown(id: string, endTime: number | string): void {
    // Clear existing interval
    if (this.countdownIntervals.has(id)) {
      window.clearInterval(this.countdownIntervals.get(id)!);
    }
    
    // Convert endTime to timestamp if it's a string
    if (typeof endTime === 'string') {
      this.globalEndTime = new Date(endTime).getTime();
    } else {
      this.globalEndTime = endTime;
    }
    
    // Set up interval to update countdown
    const interval = window.setInterval(() => {
      const timeLeft = this.getTimeLeft(this.globalEndTime!);
      
      // Update all relevant indicators
      if (id === this.defaultId && this.element) {
        const data = this.urgencyData.get(id)!;
        this.updateIndicator(this.element, data);
      } else if (this.productIndicators.has(id)) {
        const data = this.urgencyData.get(id)!;
        this.productIndicators.get(id)!.forEach(indicator => {
          this.updateIndicator(indicator, data);
        });
      }
      
      // Clear interval when countdown ends
      if (timeLeft <= 0) {
        window.clearInterval(interval);
        this.countdownIntervals.delete(id);
      }
    }, 1000) as unknown as number;
    
    // Store interval
    this.countdownIntervals.set(id, interval);
  }

  /**
   * Get time left in seconds
   */
  private getTimeLeft(endTime: number | string): number {
    const end = typeof endTime === 'string' ? new Date(endTime).getTime() : endTime;
    const now = Date.now();
    
    return Math.max(0, Math.floor((end - now) / 1000));
  }

  /**
   * Format countdown time
   */
  private formatCountdown(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    let format = this.options.countdownFormat!;
    
    // Remove parts based on options
    if (!this.options.showDays) {
      format = format.replace(/{d}d\s?/g, '');
    }
    
    if (!this.options.showHours) {
      format = format.replace(/{h}h\s?/g, '');
    }
    
    if (!this.options.showMinutes) {
      format = format.replace(/{m}m\s?/g, '');
    }
    
    if (!this.options.showSeconds) {
      format = format.replace(/{s}s\s?/g, '');
    }
    
    // Replace placeholders
    return format
      .replace('{d}', days.toString())
      .replace('{h}', hours.toString().padStart(2, '0'))
      .replace('{m}', minutes.toString().padStart(2, '0'))
      .replace('{s}', secs.toString().padStart(2, '0'));
  }

  /**
   * Add pulse animation to element
   */
  private addPulseAnimation(element: HTMLElement): void {
    element.classList.add('proovd-pulse-animation');
    
    // Add style for animation if not already added
    if (!document.getElementById('proovd-pulse-style')) {
      const style = document.createElement('style');
      style.id = 'proovd-pulse-style';
      style.textContent = `
        @keyframes proovdPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.03); }
          100% { transform: scale(1); }
        }
        
        .proovd-pulse-animation {
          animation: proovdPulse 2s infinite ease-in-out;
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * Add flashing effect to element
   */
  private addFlashingEffect(element: HTMLElement): void {
    if (element.classList.contains('proovd-flash-animation')) return;
    
    element.classList.add('proovd-flash-animation');
    
    // Add style for animation if not already added
    if (!document.getElementById('proovd-flash-style')) {
      const style = document.createElement('style');
      style.id = 'proovd-flash-style';
      style.textContent = `
        @keyframes proovdFlash {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
        
        .proovd-flash-animation {
          animation: proovdFlash 0.8s infinite ease-in-out;
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * Remove flashing effect from element
   */
  private removeFlashingEffect(element: HTMLElement): void {
    element.classList.remove('proovd-flash-animation');
  }

  /**
   * Unmount the widget
   */
  unmount(): void {
    // Clear all intervals
    for (const interval of this.countdownIntervals.values()) {
      window.clearInterval(interval);
    }
    this.countdownIntervals.clear();
    
    // Disconnect observer
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    // Remove all product indicators
    for (const indicators of this.productIndicators.values()) {
      for (const indicator of indicators) {
        if (indicator.parentNode) {
          indicator.parentNode.removeChild(indicator);
        }
      }
    }
    
    this.productIndicators.clear();
    this.urgencyData.clear();
    
    // Call parent unmount
    super.unmount();
  }
} 