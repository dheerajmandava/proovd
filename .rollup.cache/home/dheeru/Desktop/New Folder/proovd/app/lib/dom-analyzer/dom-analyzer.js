/**
 * Simple DOM Analyzer for tracking user behavior
 */
export class DOMAnalyzer {
    constructor() {
        this.metrics = {
            scrollPercentage: 0,
            timeOnPage: 0,
            clickCount: 0
        };
        this.startTime = new Date();
    }
    /**
     * Initialize the analyzer and set up event listeners
     */
    init() {
        console.log('DOMAnalyzer: Initializing...');
        // Track scroll position
        window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
        // Track clicks
        document.addEventListener('click', this.handleClick.bind(this), { passive: true });
        // Start timing
        this.startTime = new Date();
        // Update time on page periodically
        setInterval(this.updateTimeOnPage.bind(this), 1000);
        console.log('DOMAnalyzer: Initialized');
    }
    /**
     * Get current metrics
     */
    getMetrics() {
        // Update time on page before returning
        this.updateTimeOnPage();
        return Object.assign({}, this.metrics);
    }
    /**
     * Handle scroll events
     */
    handleScroll() {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight;
        const clientHeight = document.documentElement.clientHeight;
        // Calculate scroll percentage (0-100)
        this.metrics.scrollPercentage = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);
        // Clamp to valid range
        if (isNaN(this.metrics.scrollPercentage) || !isFinite(this.metrics.scrollPercentage)) {
            this.metrics.scrollPercentage = 0;
        }
        if (this.metrics.scrollPercentage < 0)
            this.metrics.scrollPercentage = 0;
        if (this.metrics.scrollPercentage > 100)
            this.metrics.scrollPercentage = 100;
    }
    /**
     * Handle click events
     */
    handleClick() {
        this.metrics.clickCount++;
    }
    /**
     * Update time on page
     */
    updateTimeOnPage() {
        const elapsed = Math.floor((new Date().getTime() - this.startTime.getTime()) / 1000);
        this.metrics.timeOnPage = elapsed;
    }
}
