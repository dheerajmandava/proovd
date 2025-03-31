/**
 * Viewer Indicator Widget
 * Shows how many people are currently viewing the website or product
 */
import { BaseWidget } from './widget-interface';
export class ViewerIndicator extends BaseWidget {
    constructor(options = {}) {
        super(options);
        this.count = 0;
        this.hideTimeout = null;
        this.productElements = [];
        this.productIndicators = new Map();
        this.options = {
            minViewers: 1,
            maxViewers: 100,
            prefix: '',
            suffix: '',
            smartText: true,
            singularText: 'person viewing',
            pluralText: 'people viewing',
            showPulse: true,
            textColor: '#ffffff',
            backgroundColor: '#1e3a8a',
            pulseColor: '#3b82f6',
            autoHideAfter: 0, // 0 means don't auto-hide
            expandOnHover: true,
            ...options
        };
    }
    /**
     * Create the widget element
     */
    createElement() {
        const element = document.createElement('div');
        element.className = 'proovd-viewer-indicator';
        // Add base styles
        element.style.display = 'flex';
        element.style.alignItems = 'center';
        element.style.padding = '6px 12px';
        element.style.borderRadius = '50px';
        element.style.backgroundColor = this.options.backgroundColor;
        element.style.color = this.options.textColor;
        element.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
        element.style.fontSize = '14px';
        element.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.1)';
        element.style.transition = 'all 0.3s ease';
        element.style.cursor = 'default';
        // Add pulse dot if enabled
        if (this.options.showPulse) {
            const pulse = document.createElement('div');
            pulse.className = 'proovd-viewer-pulse';
            pulse.style.width = '8px';
            pulse.style.height = '8px';
            pulse.style.borderRadius = '50%';
            pulse.style.backgroundColor = this.options.pulseColor;
            pulse.style.marginRight = '8px';
            pulse.style.position = 'relative';
            // Add pulse animation
            pulse.innerHTML = `
        <style>
          .proovd-viewer-pulse:before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background-color: ${this.options.pulseColor};
            opacity: 0.4;
            animation: proovd-pulse 2s infinite ease-in-out;
          }
          
          @keyframes proovd-pulse {
            0% {
              transform: scale(1);
              opacity: 0.4;
            }
            50% {
              transform: scale(2.5);
              opacity: 0;
            }
            100% {
              transform: scale(1);
              opacity: 0.4;
            }
          }
        </style>
      `;
            element.appendChild(pulse);
        }
        // Add text element
        const text = document.createElement('span');
        text.className = 'proovd-viewer-text';
        element.appendChild(text);
        // Add hover effects if enabled
        if (this.options.expandOnHover) {
            // Store the original width 
            element.addEventListener('mouseenter', () => {
                element.style.transform = 'translateY(-3px)';
                element.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
            });
            element.addEventListener('mouseleave', () => {
                element.style.transform = 'translateY(0)';
                element.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.1)';
            });
        }
        // Hide initially until we get count
        element.style.display = 'none';
        return element;
    }
    /**
     * Initialize the widget
     */
    initialize() {
        // Check if we should look for products
        if (this.options.productSelector) {
            this.findProductElements();
            // Set up observer to detect new products
            const observer = new MutationObserver(() => {
                this.findProductElements();
            });
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    }
    /**
     * Find product elements on the page
     */
    findProductElements() {
        if (!this.options.productSelector)
            return;
        // Find all matching elements
        const elements = Array.from(document.querySelectorAll(this.options.productSelector));
        // Filter to just get new elements
        const newElements = elements.filter(el => !this.productElements.includes(el));
        if (newElements.length > 0) {
            // Add new elements to our list
            this.productElements.push(...newElements);
            // Create indicators for each new element
            for (const productEl of newElements) {
                this.createProductIndicator(productEl);
            }
        }
    }
    /**
     * Create an indicator for a specific product element
     */
    createProductIndicator(productEl) {
        // Create a clone of our main indicator
        const indicator = this.createElement();
        // Get position relative to product
        indicator.style.position = 'absolute';
        switch (this.options.productPosition) {
            case 'top-left':
                indicator.style.top = '10px';
                indicator.style.left = '10px';
                break;
            case 'top-right':
                indicator.style.top = '10px';
                indicator.style.right = '10px';
                break;
            case 'bottom-left':
                indicator.style.bottom = '10px';
                indicator.style.left = '10px';
                break;
            case 'bottom-right':
            default:
                indicator.style.bottom = '10px';
                indicator.style.right = '10px';
                break;
        }
        // Make sure product is positioned relatively
        const productPosition = window.getComputedStyle(productEl).position;
        if (productPosition === 'static') {
            productEl.style.position = 'relative';
        }
        // Add to the product element
        productEl.appendChild(indicator);
        // Store in our map
        this.productIndicators.set(productEl, indicator);
        // Update it immediately
        this.updateIndicatorText(indicator);
    }
    /**
     * Update the widget with new data
     */
    update(data) {
        if (typeof data.count !== 'number')
            return;
        // Store count
        this.count = Math.min(data.count, this.options.maxViewers);
        // Update main indicator if not using product selector
        if (!this.options.productSelector && this.element) {
            this.updateIndicatorText(this.element);
        }
        // Update all product indicators
        for (const indicator of this.productIndicators.values()) {
            this.updateIndicatorText(indicator);
        }
        // Handle auto-hide
        if (this.options.autoHideAfter && this.options.autoHideAfter > 0) {
            // Clear existing timeout
            if (this.hideTimeout !== null) {
                window.clearTimeout(this.hideTimeout);
            }
            // Set new timeout
            this.hideTimeout = window.setTimeout(() => {
                if (this.element) {
                    this.element.style.display = 'none';
                }
                for (const indicator of this.productIndicators.values()) {
                    indicator.style.display = 'none';
                }
            }, this.options.autoHideAfter);
        }
    }
    /**
     * Update the text in an indicator element
     */
    updateIndicatorText(indicator) {
        // Show only if we meet minimum viewers
        if (this.count < this.options.minViewers) {
            indicator.style.display = 'none';
            return;
        }
        // Get text element
        const text = indicator.querySelector('.proovd-viewer-text');
        if (!text)
            return;
        // Determine text to show
        let viewerText = '';
        if (this.options.smartText) {
            viewerText = this.count === 1
                ? this.options.singularText
                : this.options.pluralText;
        }
        // Set final text with prefix/suffix
        text.textContent = `${this.options.prefix} ${this.count} ${viewerText} ${this.options.suffix}`.trim();
        // Show the indicator
        indicator.style.display = 'flex';
    }
    /**
     * Unmount the widget
     */
    unmount() {
        // Remove all product indicators
        for (const [product, indicator] of this.productIndicators.entries()) {
            if (indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
        }
        this.productIndicators.clear();
        this.productElements = [];
        // Clear any timeouts
        if (this.hideTimeout !== null) {
            window.clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }
        // Call parent unmount
        super.unmount();
    }
}
