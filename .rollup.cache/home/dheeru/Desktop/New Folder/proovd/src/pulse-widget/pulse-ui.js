/**
 * ProovdPulse UI Component
 * Renders the visual elements of the ProovdPulse widget
 */
const DEFAULT_OPTIONS = {
    container: 'body',
    theme: 'light',
    position: 'bottom-right',
    showPulse: true,
    pulseColor: '#4338ca',
    textColor: '#111827',
    backgroundColor: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontSize: '14px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    zIndex: 9999
};
export class PulseUI {
    constructor(options) {
        this.widget = null;
        this.userCountElement = null;
        this.activeUsers = 0;
        this.options = Object.assign(Object.assign({}, DEFAULT_OPTIONS), options);
        // Get container
        if (typeof this.options.container === 'string') {
            const containerElement = document.querySelector(this.options.container);
            if (!containerElement) {
                throw new Error(`ProovdPulse: Container element "${this.options.container}" not found`);
            }
            this.container = containerElement;
        }
        else {
            this.container = this.options.container;
        }
    }
    /**
     * Create and mount the widget
     */
    mount() {
        if (this.widget) {
            return; // Already mounted
        }
        // Create widget wrapper
        this.widget = document.createElement('div');
        this.widget.className = 'proovd-pulse-widget';
        this.applyStyles(this.widget, Object.assign(Object.assign({ position: 'fixed' }, this.getPositionStyles()), { display: 'flex', alignItems: 'center', padding: '8px 12px', backgroundColor: this.options.backgroundColor, color: this.options.textColor, fontFamily: this.options.fontFamily, fontSize: this.options.fontSize, borderRadius: this.options.borderRadius, boxShadow: this.options.boxShadow, zIndex: this.options.zIndex.toString(), margin: '16px', transition: 'opacity 0.3s ease' }));
        // Create pulse indicator if enabled
        if (this.options.showPulse) {
            const pulseIndicator = document.createElement('div');
            pulseIndicator.className = 'proovd-pulse-indicator';
            this.applyStyles(pulseIndicator, {
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: this.options.pulseColor,
                marginRight: '8px',
                position: 'relative'
            });
            // Add pulse animation
            const pulse = document.createElement('div');
            pulse.className = 'proovd-pulse-animation';
            this.applyStyles(pulse, {
                position: 'absolute',
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                backgroundColor: this.options.pulseColor,
                opacity: '0.6',
                transform: 'scale(1)',
                animation: 'proovd-pulse 1.5s infinite'
            });
            // Add CSS animation
            const style = document.createElement('style');
            style.innerHTML = `
        @keyframes proovd-pulse {
          0% {
            transform: scale(1);
            opacity: 0.6;
          }
          100% {
            transform: scale(2.5);
            opacity: 0;
          }
        }
      `;
            document.head.appendChild(style);
            pulseIndicator.appendChild(pulse);
            this.widget.appendChild(pulseIndicator);
        }
        // Create user count element
        this.userCountElement = document.createElement('div');
        this.userCountElement.className = 'proovd-pulse-user-count';
        this.updateUserCount(this.activeUsers);
        this.widget.appendChild(this.userCountElement);
        // Add widget to container
        this.container.appendChild(this.widget);
    }
    /**
     * Update the active user count
     */
    updateUserCount(count) {
        this.activeUsers = count;
        if (this.userCountElement) {
            this.userCountElement.textContent = `${count} active user${count !== 1 ? 's' : ''}`;
        }
    }
    /**
     * Unmount the widget
     */
    unmount() {
        if (this.widget && this.widget.parentNode) {
            this.widget.parentNode.removeChild(this.widget);
            this.widget = null;
            this.userCountElement = null;
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
    /**
     * Get position styles based on the position option
     */
    getPositionStyles() {
        switch (this.options.position) {
            case 'top-left':
                return { top: '0', left: '0' };
            case 'top-right':
                return { top: '0', right: '0' };
            case 'bottom-left':
                return { bottom: '0', left: '0' };
            case 'bottom-right':
            default:
                return { bottom: '0', right: '0' };
        }
    }
}
