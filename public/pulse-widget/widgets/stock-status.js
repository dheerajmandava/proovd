/**
 * ProovdPulse Stock Status Widget
 * ------------------------------
 * Shows inventory status and creates urgency
 */
export class StockStatus {
    constructor(config) {
        this.container = null;
        this.element = null;
        this.currentStock = 0;
        this.config = config;
        // Default options
        const defaultOptions = {
            position: 'bottom-left',
            lowStockThreshold: 10,
            criticalStockThreshold: 5,
            showActualCount: true,
            pulseAnimation: true,
            backgroundColor: '#FFFFFF',
            lowStockColor: '#F59E0B', // Amber-500
            criticalStockColor: '#EF4444', // Red-500
            textColor: '#374151', // Gray-700
            fontSize: '14px'
        };
        // Merge with provided options
        this.options = {
            ...defaultOptions,
            ...(config.options || {})
        };
    }
    /**
     * Mount the widget to the container
     */
    mount(container) {
        if (this.element) {
            this.unmount();
        }
        this.container = container;
        // Create main element
        this.element = document.createElement('div');
        this.element.className = 'proovd-pulse-stock-status';
        this.applyStyles(this.element, {
            position: 'absolute',
            ...this.getPositionStyles(),
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            borderRadius: '6px',
            backgroundColor: this.options.backgroundColor,
            boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
            color: this.options.textColor,
            fontSize: this.options.fontSize,
            fontWeight: '500',
            zIndex: '5',
            transition: 'all 0.3s ease',
            opacity: '0', // Start hidden until we get data
            transform: 'translateY(10px)',
            pointerEvents: 'none' // Don't interfere with page interaction
        });
        // Add to container
        this.container.appendChild(this.element);
    }
    /**
     * Update stock data
     */
    update(data) {
        if (!this.element || typeof data.currentStock !== 'number')
            return;
        const oldStock = this.currentStock;
        this.currentStock = data.currentStock;
        // Determine status based on thresholds
        let statusText = '';
        let statusColor = this.options.textColor;
        if (this.currentStock <= this.options.criticalStockThreshold) {
            // Critical low stock
            statusText = this.options.showActualCount
                ? `Only ${this.currentStock} left in stock!`
                : 'Almost sold out!';
            statusColor = this.options.criticalStockColor;
            // Add pulse animation for critical stock
            if (this.options.pulseAnimation) {
                this.applyPulseAnimation();
            }
        }
        else if (this.currentStock <= this.options.lowStockThreshold) {
            // Low stock
            statusText = this.options.showActualCount
                ? `Only ${this.currentStock} left in stock`
                : 'Low stock available';
            statusColor = this.options.lowStockColor;
        }
        else {
            // Normal stock - hide the widget
            this.hideWidget();
            return;
        }
        // Show the widget with updated text
        this.showWidget(statusText, statusColor);
        // Animate if stock decreased
        if (oldStock > 0 && this.currentStock < oldStock) {
            this.animateStockChange();
        }
    }
    /**
     * Show widget with status text
     */
    showWidget(text, color) {
        if (!this.element)
            return;
        // Update text and color
        this.element.textContent = text;
        this.element.style.color = color;
        // Make visible with animation
        this.applyStyles(this.element, {
            opacity: '1',
            transform: 'translateY(0)'
        });
    }
    /**
     * Hide the widget
     */
    hideWidget() {
        if (!this.element)
            return;
        this.applyStyles(this.element, {
            opacity: '0',
            transform: 'translateY(10px)'
        });
    }
    /**
     * Animate stock change
     */
    animateStockChange() {
        if (!this.element)
            return;
        // Create and append flash element
        const flash = document.createElement('div');
        flash.className = 'proovd-pulse-stock-flash';
        this.applyStyles(flash, {
            position: 'absolute',
            inset: '0',
            backgroundColor: this.options.criticalStockColor,
            opacity: '0.3',
            borderRadius: '6px',
            pointerEvents: 'none'
        });
        this.element.appendChild(flash);
        // Animate and remove
        setTimeout(() => {
            this.applyStyles(flash, {
                opacity: '0',
                transition: 'opacity 0.5s ease'
            });
            setTimeout(() => {
                if (flash.parentNode) {
                    flash.parentNode.removeChild(flash);
                }
            }, 500);
        }, 10);
    }
    /**
     * Apply pulse animation
     */
    applyPulseAnimation() {
        if (!this.element)
            return;
        // Create style element if not exists
        let styleElement = document.getElementById('proovd-pulse-stock-animation-style');
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = 'proovd-pulse-stock-animation-style';
            styleElement.textContent = `
        @keyframes proovdPulseStock {
          0% { transform: scale(1); }
          50% { transform: scale(1.03); }
          100% { transform: scale(1); }
        }
      `;
            document.head.appendChild(styleElement);
        }
        // Apply animation
        this.applyStyles(this.element, {
            animation: 'proovdPulseStock 2s infinite'
        });
    }
    /**
     * Remove the widget from DOM
     */
    unmount() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
        this.container = null;
    }
    /**
     * Get position styles based on options
     */
    getPositionStyles() {
        switch (this.options.position) {
            case 'top-left':
                return { top: '10px', left: '10px' };
            case 'top-right':
                return { top: '10px', right: '10px' };
            case 'bottom-left':
                return { bottom: '10px', left: '10px' };
            case 'bottom-right':
                return { bottom: '10px', right: '10px' };
            default:
                return { bottom: '10px', left: '10px' };
        }
    }
    /**
     * Apply CSS styles to an element
     */
    applyStyles(element, styles) {
        Object.entries(styles).forEach(([property, value]) => {
            element.style[property] = value;
        });
    }
}
