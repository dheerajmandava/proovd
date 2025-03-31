/**
 * ProovdPulse Purchase Notification Widget
 * ---------------------------------------
 * Shows recent purchase notifications as toast messages
 */

import { WidgetConfig, WidgetInterface } from '../widget-registry';
import { BaseWidget, BaseWidgetOptions } from './widget-interface';

export interface PurchaseNotificationOptions extends BaseWidgetOptions {
  /**
   * Maximum number of notifications to show at once
   */
  maxNotifications?: number;

  /**
   * How long to show each notification (milliseconds)
   */
  displayTime?: number;

  /**
   * Whether to show the time ago
   */
  showTimeAgo?: boolean;

  /**
   * Whether to show the location
   */
  showLocation?: boolean;

  /**
   * Template for the notification message
   * Available variables: {{name}}, {{location}}, {{timeAgo}}
   */
  template?: string;

  /**
   * Notification background color
   */
  backgroundColor?: string;

  /**
   * Text color
   */
  textColor?: string;

  /**
   * Accent color (for borders, icons)
   */
  accentColor?: string;

  /**
   * Whether to include product image if available
   */
  showProductImage?: boolean;

  /**
   * Animation style for entrance/exit
   */
  animationStyle?: 'slide' | 'fade' | 'pop';

  /**
   * Queue behavior when multiple purchases come in
   */
  queueBehavior?: 'replace' | 'stack';

  /**
   * Distance between stacked notifications (in pixels)
   */
  stackGap?: number;
}

interface PurchaseData {
  productName: string;
  location?: string;
  timestamp: Date | string;
  image?: string;
  productId?: string;
  productUrl?: string;
  price?: string | number;
  currency?: string;
}

export class PurchaseNotification extends BaseWidget {
  protected options: PurchaseNotificationOptions;
  private notifications: HTMLElement[] = [];
  private notificationQueue: PurchaseData[] = [];
  private isProcessingQueue = false;

  constructor(options: PurchaseNotificationOptions = {}) {
    super(options);
    
    this.options = {
      maxNotifications: 3,
      displayTime: 5000,
      showTimeAgo: true,
      showLocation: true,
      template: 'Someone from {{location}} purchased {{name}} {{timeAgo}}',
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      accentColor: '#3b82f6',
      showProductImage: true,
      animationStyle: 'slide',
      queueBehavior: 'stack',
      stackGap: 10,
      ...options
    };
  }

  /**
   * Create the widget element
   */
  protected createElement(): HTMLElement {
    const element = document.createElement('div');
    element.className = 'proovd-purchase-notification-container';
    
    // Add container styles
    element.style.display = 'flex';
    element.style.flexDirection = 'column';
    element.style.gap = `${this.options.stackGap}px`;
    
    // Apply positioning based on the position option
    switch (this.options.position) {
      case 'top-left':
        element.style.alignItems = 'flex-start';
        break;
      case 'top-right':
        element.style.alignItems = 'flex-end';
        break;
      case 'bottom-left':
        element.style.alignItems = 'flex-start';
        break;
      case 'bottom-right':
      default:
        element.style.alignItems = 'flex-end';
        break;
    }
    
    return element;
  }

  /**
   * Update the widget with new purchase data
   */
  update(data: PurchaseData): void {
    // Validate data
    if (!data || !data.productName) return;
    
    // Add to queue
    this.notificationQueue.push(data);
    
    // Process queue if not already processing
    if (!this.isProcessingQueue) {
      this.processQueue();
    }
  }

  /**
   * Process notifications in the queue
   */
  private processQueue(): void {
    if (this.notificationQueue.length === 0) {
      this.isProcessingQueue = false;
      return;
    }
    
    this.isProcessingQueue = true;
    
    // Get the next notification from the queue
    const data = this.notificationQueue.shift()!;
    
    // Create and show notification
    this.showNotification(data);
    
    // Continue processing queue after a short delay
    setTimeout(() => {
      this.processQueue();
    }, 300);
  }

  /**
   * Create and show a notification
   */
  private showNotification(data: PurchaseData): void {
    if (!this.element) return;
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'proovd-purchase-notification';
    
    // Add notification styles
    notification.style.backgroundColor = this.options.backgroundColor!;
    notification.style.color = this.options.textColor!;
    notification.style.borderLeft = `4px solid ${this.options.accentColor}`;
    notification.style.borderRadius = '6px';
    notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    notification.style.padding = '12px';
    notification.style.width = '280px';
    notification.style.maxWidth = '90vw';
    notification.style.boxSizing = 'border-box';
    notification.style.position = 'relative';
    notification.style.overflow = 'hidden';
    
    // Add entrance animation
    this.applyEntranceAnimation(notification);
    
    // Create notification content
    const content = document.createElement('div');
    content.style.display = 'flex';
    content.style.gap = '12px';
    
    // Add product image if available and enabled
    if (this.options.showProductImage && data.image) {
      const imageContainer = document.createElement('div');
      imageContainer.style.width = '48px';
      imageContainer.style.height = '48px';
      imageContainer.style.flexShrink = '0';
      imageContainer.style.borderRadius = '4px';
      imageContainer.style.overflow = 'hidden';
      
      const image = document.createElement('img');
      image.src = data.image;
      image.alt = data.productName;
      image.style.width = '100%';
      image.style.height = '100%';
      image.style.objectFit = 'cover';
      
      imageContainer.appendChild(image);
      content.appendChild(imageContainer);
    }
    
    // Add text content
    const textContent = document.createElement('div');
    textContent.style.flex = '1';
    
    // Apply template
    const message = this.applyTemplate(data);
    textContent.textContent = message;
    
    // Add more product details if available
    if (data.price) {
      const priceElement = document.createElement('div');
      priceElement.style.fontWeight = 'bold';
      priceElement.style.marginTop = '4px';
      
      let priceText = '';
      if (typeof data.price === 'number') {
        // Format as currency if currency is provided
        if (data.currency) {
          try {
            priceText = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: data.currency
            }).format(data.price);
          } catch (e) {
            priceText = `${data.currency} ${data.price}`;
          }
        } else {
          priceText = data.price.toString();
        }
      } else {
        priceText = data.price;
      }
      
      priceElement.textContent = priceText;
      textContent.appendChild(priceElement);
    }
    
    content.appendChild(textContent);
    notification.appendChild(content);
    
    // Add progress bar
    const progressBar = document.createElement('div');
    progressBar.className = 'proovd-notification-progress';
    progressBar.style.position = 'absolute';
    progressBar.style.bottom = '0';
    progressBar.style.left = '0';
    progressBar.style.height = '2px';
    progressBar.style.backgroundColor = this.options.accentColor!;
    progressBar.style.width = '100%';
    progressBar.style.transform = 'scaleX(1)';
    progressBar.style.transformOrigin = 'left';
    progressBar.style.transition = `transform ${this.options.displayTime}ms linear`;
    
    notification.appendChild(progressBar);
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.className = 'proovd-notification-close';
    closeButton.innerHTML = '&times;';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '8px';
    closeButton.style.right = '8px';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.color = this.options.textColor!;
    closeButton.style.fontSize = '16px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.opacity = '0.5';
    closeButton.style.transition = 'opacity 0.2s';
    
    closeButton.addEventListener('mouseenter', () => {
      closeButton.style.opacity = '1';
    });
    
    closeButton.addEventListener('mouseleave', () => {
      closeButton.style.opacity = '0.5';
    });
    
    closeButton.addEventListener('click', () => {
      this.removeNotification(notification);
    });
    
    notification.appendChild(closeButton);
    
    // Manage notifications limit
    if (this.options.queueBehavior === 'replace' && this.notifications.length >= this.options.maxNotifications!) {
      // Replace the oldest notification
      const oldest = this.notifications.shift();
      if (oldest && oldest.parentNode) {
        oldest.parentNode.removeChild(oldest);
      }
    } else if (this.notifications.length >= this.options.maxNotifications!) {
      // Don't add new notification if we're at the limit
      return;
    }
    
    // Add to our list
    this.notifications.push(notification);
    
    // Add to DOM
    this.element.appendChild(notification);
    
    // Trigger progress bar animation
    setTimeout(() => {
      progressBar.style.transform = 'scaleX(0)';
    }, 10);
    
    // Auto-remove after display time
    setTimeout(() => {
      this.removeNotification(notification);
    }, this.options.displayTime!);
  }

  /**
   * Remove a notification
   */
  private removeNotification(notification: HTMLElement): void {
    if (!notification.parentNode) return;
    
    // Apply exit animation
    this.applyExitAnimation(notification, () => {
      // Remove from DOM after animation
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
      
      // Remove from our list
      const index = this.notifications.indexOf(notification);
      if (index !== -1) {
        this.notifications.splice(index, 1);
      }
    });
  }

  /**
   * Apply entrance animation based on style
   */
  private applyEntranceAnimation(notification: HTMLElement): void {
    switch (this.options.animationStyle) {
      case 'fade':
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s ease-in-out';
        
        // Trigger animation
        setTimeout(() => {
          notification.style.opacity = '1';
        }, 10);
        break;
        
      case 'pop':
        notification.style.transform = 'scale(0.8)';
        notification.style.opacity = '0';
        notification.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
        
        // Trigger animation
        setTimeout(() => {
          notification.style.transform = 'scale(1)';
          notification.style.opacity = '1';
        }, 10);
        break;
        
      case 'slide':
      default:
        notification.style.transform = 'translateX(100%)';
        notification.style.transition = 'transform 0.3s ease-out';
        
        // Adjust for left-side positions
        if (this.options.position === 'top-left' || this.options.position === 'bottom-left') {
          notification.style.transform = 'translateX(-100%)';
        }
        
        // Trigger animation
        setTimeout(() => {
          notification.style.transform = 'translateX(0)';
        }, 10);
        break;
    }
  }

  /**
   * Apply exit animation based on style
   */
  private applyExitAnimation(notification: HTMLElement, callback: () => void): void {
    let animationDuration = 300; // ms
    
    switch (this.options.animationStyle) {
      case 'fade':
        notification.style.opacity = '0';
        notification.style.transition = `opacity ${animationDuration}ms ease-in-out`;
        break;
        
      case 'pop':
        notification.style.transform = 'scale(0.8)';
        notification.style.opacity = '0';
        notification.style.transition = `transform ${animationDuration}ms ease-in, opacity ${animationDuration}ms ease-in`;
        break;
        
      case 'slide':
      default:
        notification.style.transform = 'translateX(100%)';
        notification.style.transition = `transform ${animationDuration}ms ease-in`;
        
        // Adjust for left-side positions
        if (this.options.position === 'top-left' || this.options.position === 'bottom-left') {
          notification.style.transform = 'translateX(-100%)';
        }
        break;
    }
    
    // Call callback after animation completes
    setTimeout(callback, animationDuration);
  }

  /**
   * Apply template to data
   */
  private applyTemplate(data: PurchaseData): string {
    let message = this.options.template!;
    
    // Replace name
    message = message.replace(/{{name}}/g, data.productName);
    
    // Replace location if available and enabled
    if (this.options.showLocation && data.location) {
      message = message.replace(/{{location}}/g, data.location);
    } else {
      message = message.replace(/{{location}}/g, 'somewhere');
    }
    
    // Replace time ago if enabled
    if (this.options.showTimeAgo) {
      const timeAgo = this.formatTimeAgo(data.timestamp);
      message = message.replace(/{{timeAgo}}/g, timeAgo);
    } else {
      message = message.replace(/{{timeAgo}}/g, '');
    }
    
    return message;
  }

  /**
   * Format time ago
   */
  private formatTimeAgo(timestamp: Date | string): string {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const now = new Date();
    
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) {
      return 'just now';
    }
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    
    const days = Math.floor(hours / 24);
    if (days < 30) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
    
    const months = Math.floor(days / 30);
    if (months < 12) {
      return `${months} month${months > 1 ? 's' : ''} ago`;
    }
    
    const years = Math.floor(months / 12);
    return `${years} year${years > 1 ? 's' : ''} ago`;
  }

  /**
   * Unmount the widget
   */
  unmount(): void {
    // Clear any remaining notifications
    this.notifications.forEach(notification => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    });
    
    this.notifications = [];
    this.notificationQueue = [];
    this.isProcessingQueue = false;
    
    // Call parent unmount
    super.unmount();
  }
} 