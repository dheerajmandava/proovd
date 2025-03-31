export class AnalyticsWidget {
    constructor(options = {}) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        this.container = null;
        this.data = {};
        this.elements = {};
        this.chartInstance = null;
        this.refreshTimer = null;
        this.expanded = false;
        this.chartLibraryLoaded = false;
        // Extract options from the widget config
        this.options = {
            position: ((_a = options.options) === null || _a === void 0 ? void 0 : _a.position) || 'bottom-right',
            theme: ((_b = options.options) === null || _b === void 0 ? void 0 : _b.theme) || 'light',
            showInactiveUsers: ((_c = options.options) === null || _c === void 0 ? void 0 : _c.showInactiveUsers) !== undefined ? options.options.showInactiveUsers : true,
            inactiveThreshold: ((_d = options.options) === null || _d === void 0 ? void 0 : _d.inactiveThreshold) || 300, // 5 minutes
            chartType: ((_e = options.options) === null || _e === void 0 ? void 0 : _e.chartType) || 'line',
            metrics: ((_f = options.options) === null || _f === void 0 ? void 0 : _f.metrics) || ['viewers', 'clicks', 'scrollDepth', 'timeOnPage'],
            refreshInterval: ((_g = options.options) === null || _g === void 0 ? void 0 : _g.refreshInterval) || 30,
            showRealTime: ((_h = options.options) === null || _h === void 0 ? void 0 : _h.showRealTime) !== undefined ? options.options.showRealTime : true,
            compactView: ((_j = options.options) === null || _j === void 0 ? void 0 : _j.compactView) !== undefined ? options.options.compactView : true,
            dashboardLink: ((_k = options.options) === null || _k === void 0 ? void 0 : _k.dashboardLink) || '',
            customColors: ((_l = options.options) === null || _l === void 0 ? void 0 : _l.customColors) || ['#4C6FFF', '#FF6B6B', '#32D583', '#F2994A', '#BB6BD9']
        };
        // Get the container from the global widgetRegistry
        const widgetRegistry = window.widgetRegistryContainer;
        if (widgetRegistry) {
            this.container = widgetRegistry;
        }
    }
    /**
     * Mount the widget to the DOM
     */
    mount() {
        if (!this.container) {
            console.error('Analytics Widget: Container is not available');
            return;
        }
        this.render();
        this.loadDependencies();
        if (this.options.refreshInterval && this.options.refreshInterval > 0) {
            this.startRefreshTimer();
        }
    }
    /**
     * Unmount the widget from the DOM
     */
    unmount() {
        if (this.refreshTimer !== null) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
        if (this.chartInstance) {
            // Clean up chart instance if using a charting library
            this.chartInstance = null;
        }
        if (this.container && this.elements.widget) {
            this.container.removeChild(this.elements.widget);
        }
        this.elements = {};
    }
    /**
     * Update widget with new data
     */
    update(data) {
        if (data.type === 'analytics' || data.type === 'stats') {
            // Update our data object with new values
            if (data.activeUsers !== undefined)
                this.data.activeUsers = data.activeUsers;
            if (data.inactiveUsers !== undefined)
                this.data.inactiveUsers = data.inactiveUsers;
            if (data.totalUsers !== undefined)
                this.data.totalUsers = data.totalUsers;
            if (data.pageViews !== undefined)
                this.data.pageViews = data.pageViews;
            if (data.avgTimeOnPage !== undefined)
                this.data.avgTimeOnPage = data.avgTimeOnPage;
            if (data.bounceRate !== undefined)
                this.data.bounceRate = data.bounceRate;
            if (data.conversionRate !== undefined)
                this.data.conversionRate = data.conversionRate;
            if (data.clickCount !== undefined)
                this.data.clickCount = data.clickCount;
            if (data.avgScrollDepth !== undefined)
                this.data.avgScrollDepth = data.avgScrollDepth;
            if (data.purchaseCount !== undefined)
                this.data.purchaseCount = data.purchaseCount;
            if (data.timeSeriesData !== undefined)
                this.data.timeSeriesData = data.timeSeriesData;
            // Update the UI with new data
            this.updateUI();
        }
    }
    /**
     * Clean up resources used by the widget
     */
    destroy() {
        this.unmount();
    }
    /**
     * Render the analytics widget
     */
    render() {
        if (!this.container)
            return;
        // Create widget container
        const widget = document.createElement('div');
        widget.className = 'proovd-analytics-widget';
        widget.setAttribute('data-theme', this.options.theme || 'light');
        widget.setAttribute('data-position', this.options.position || 'bottom-right');
        widget.setAttribute('data-view', this.options.compactView ? 'compact' : 'full');
        // Apply styles
        const styles = this.getStyles();
        const styleElement = document.createElement('style');
        styleElement.textContent = styles;
        widget.appendChild(styleElement);
        // Create header
        const header = document.createElement('div');
        header.className = 'proovd-analytics-header';
        const title = document.createElement('div');
        title.className = 'proovd-analytics-title';
        title.textContent = 'ProovdPulse Analytics';
        header.appendChild(title);
        const controls = document.createElement('div');
        controls.className = 'proovd-analytics-controls';
        const refreshButton = document.createElement('button');
        refreshButton.className = 'proovd-analytics-refresh';
        refreshButton.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>`;
        refreshButton.addEventListener('click', () => this.refreshData());
        controls.appendChild(refreshButton);
        const expandButton = document.createElement('button');
        expandButton.className = 'proovd-analytics-expand';
        expandButton.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>`;
        expandButton.addEventListener('click', () => this.toggleExpand());
        controls.appendChild(expandButton);
        const closeButton = document.createElement('button');
        closeButton.className = 'proovd-analytics-close';
        closeButton.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`;
        closeButton.addEventListener('click', () => this.hide());
        controls.appendChild(closeButton);
        header.appendChild(controls);
        widget.appendChild(header);
        // Create body
        const body = document.createElement('div');
        body.className = 'proovd-analytics-body';
        // Create metrics section
        const metrics = document.createElement('div');
        metrics.className = 'proovd-analytics-metrics';
        body.appendChild(metrics);
        // Create chart section
        const chart = document.createElement('div');
        chart.className = 'proovd-analytics-chart';
        body.appendChild(chart);
        widget.appendChild(body);
        // Create footer with link to dashboard if provided
        if (this.options.dashboardLink) {
            const footer = document.createElement('div');
            footer.className = 'proovd-analytics-footer';
            const link = document.createElement('a');
            link.href = this.options.dashboardLink;
            link.target = '_blank';
            link.textContent = 'View Full Dashboard';
            link.className = 'proovd-analytics-dashboard-link';
            footer.appendChild(link);
            widget.appendChild(footer);
        }
        // Store references to elements
        this.elements.widget = widget;
        this.elements.header = header;
        this.elements.body = body;
        this.elements.chart = chart;
        this.elements.metrics = metrics;
        this.elements.expandButton = expandButton;
        this.elements.closeButton = closeButton;
        this.elements.refreshButton = refreshButton;
        // Add the widget to the container
        this.container.appendChild(widget);
        // Initial UI update
        this.updateUI();
    }
    /**
     * Update the UI with current data
     */
    updateUI() {
        var _a, _b, _c, _d, _e;
        if (!this.elements.metrics || !this.data)
            return;
        // Clear existing metrics
        this.elements.metrics.innerHTML = '';
        // Create metric cards
        if (((_a = this.options.metrics) === null || _a === void 0 ? void 0 : _a.includes('viewers')) && (this.data.activeUsers !== undefined || this.data.totalUsers !== undefined)) {
            this.createMetricCard('Active Users', this.data.activeUsers || 0, 'users');
            if (this.options.showInactiveUsers && this.data.inactiveUsers !== undefined) {
                this.createMetricCard('Inactive Users', this.data.inactiveUsers, 'users');
            }
            if (this.data.totalUsers !== undefined) {
                this.createMetricCard('Total Users', this.data.totalUsers, 'users');
            }
        }
        if (((_b = this.options.metrics) === null || _b === void 0 ? void 0 : _b.includes('clicks')) && this.data.clickCount !== undefined) {
            this.createMetricCard('Clicks', this.data.clickCount, 'clicks');
        }
        if (((_c = this.options.metrics) === null || _c === void 0 ? void 0 : _c.includes('scrollDepth')) && this.data.avgScrollDepth !== undefined) {
            this.createMetricCard('Avg Scroll Depth', this.data.avgScrollDepth, 'percent');
        }
        if (((_d = this.options.metrics) === null || _d === void 0 ? void 0 : _d.includes('timeOnPage')) && this.data.avgTimeOnPage !== undefined) {
            this.createMetricCard('Avg Time on Page', this.formatTime(this.data.avgTimeOnPage), '');
        }
        if (((_e = this.options.metrics) === null || _e === void 0 ? void 0 : _e.includes('purchases')) && this.data.purchaseCount !== undefined) {
            this.createMetricCard('Purchases', this.data.purchaseCount, 'count');
            if (this.data.conversionRate !== undefined) {
                this.createMetricCard('Conversion Rate', this.data.conversionRate, 'percent');
            }
        }
        // Update chart if available
        this.updateChart();
    }
    /**
     * Create a metric card
     */
    createMetricCard(label, value, unit) {
        if (!this.elements.metrics)
            return;
        const card = document.createElement('div');
        card.className = 'proovd-analytics-metric-card';
        const labelEl = document.createElement('div');
        labelEl.className = 'proovd-analytics-metric-label';
        labelEl.textContent = label;
        card.appendChild(labelEl);
        const valueEl = document.createElement('div');
        valueEl.className = 'proovd-analytics-metric-value';
        // Format the value based on the unit
        let displayValue = value;
        if (unit === 'percent' && typeof value === 'number') {
            displayValue = `${value.toFixed(1)}%`;
        }
        else if (unit === 'users' || unit === 'clicks' || unit === 'count') {
            displayValue = typeof value === 'number' ? value.toLocaleString() : value;
        }
        valueEl.textContent = displayValue.toString();
        card.appendChild(valueEl);
        this.elements.metrics.appendChild(card);
    }
    /**
     * Update the chart with new data
     */
    updateChart() {
        if (!this.elements.chart || !this.chartLibraryLoaded)
            return;
        if (this.data.timeSeriesData) {
            // This would use the chosen chart library (Chart.js, D3, etc.)
            // For now, we'll just create a placeholder
            if (!this.chartInstance) {
                // Create new chart
                this.elements.chart.innerHTML = '<div class="proovd-analytics-chart-placeholder">Chart will appear here once data is available</div>';
                // If we had a chart library loaded, we would initialize it here
                // this.chartInstance = new Chart(...)
            }
            else {
                // Update existing chart
                // this.chartInstance.data = ...
                // this.chartInstance.update()
            }
        }
        else {
            this.elements.chart.innerHTML = '<div class="proovd-analytics-chart-placeholder">No time series data available</div>';
        }
    }
    /**
     * Load chart library dependencies
     */
    loadDependencies() {
        // Check if dependency is already loaded
        if (window.Chart) {
            this.chartLibraryLoaded = true;
            this.updateChart();
            return;
        }
        // Load Chart.js (or other library)
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.async = true;
        script.onload = () => {
            this.chartLibraryLoaded = true;
            this.updateChart();
        };
        document.head.appendChild(script);
    }
    /**
     * Start refresh timer
     */
    startRefreshTimer() {
        if (this.refreshTimer !== null) {
            clearInterval(this.refreshTimer);
        }
        this.refreshTimer = window.setInterval(() => {
            if (this.options.showRealTime) {
                this.refreshData();
            }
        }, (this.options.refreshInterval || 30) * 1000);
    }
    /**
     * Refresh data from server
     */
    refreshData() {
        // This would normally trigger a data fetch from the server
        // For now, we'll just simulate with random data in a real implementation
        // Dispatch a custom event that the main ProovdPulse class can listen for
        const event = new CustomEvent('proovdpulse:refresh-analytics', {
            detail: {
                timestamp: new Date().toISOString()
            }
        });
        document.dispatchEvent(event);
    }
    /**
     * Toggle expanded view
     */
    toggleExpand() {
        if (!this.elements.widget)
            return;
        this.expanded = !this.expanded;
        this.elements.widget.setAttribute('data-view', this.expanded ? 'full' : 'compact');
        if (this.elements.expandButton) {
            this.elements.expandButton.innerHTML = this.expanded
                ? `<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>`
                : `<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>`;
        }
        // Redraw chart if needed
        if (this.expanded) {
            window.setTimeout(() => this.updateChart(), 300); // Wait for animation
        }
    }
    /**
     * Hide the widget
     */
    hide() {
        if (this.elements.widget) {
            this.elements.widget.style.display = 'none';
        }
    }
    /**
     * Format seconds into a readable time string
     */
    formatTime(seconds) {
        if (seconds < 60) {
            return `${seconds}s`;
        }
        else if (seconds < 3600) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            return `${minutes}m ${remainingSeconds}s`;
        }
        else {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            return `${hours}h ${minutes}m`;
        }
    }
    /**
     * Get CSS styles for the widget
     */
    getStyles() {
        return `
      .proovd-analytics-widget {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-size: 14px;
        line-height: 1.5;
        background-color: var(--proovd-bg-color, #ffffff);
        color: var(--proovd-text-color, #333333);
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        width: 300px;
        transition: all 0.3s ease;
        transform-origin: bottom right;
        max-height: 500px;
      }
      
      .proovd-analytics-widget[data-theme="dark"] {
        --proovd-bg-color: #24292e;
        --proovd-text-color: #ffffff;
        --proovd-border-color: #444444;
        --proovd-card-bg: #2d333b;
        --proovd-accent-color: #58a6ff;
      }
      
      .proovd-analytics-widget[data-theme="light"] {
        --proovd-bg-color: #ffffff;
        --proovd-text-color: #333333;
        --proovd-border-color: #e1e4e8;
        --proovd-card-bg: #f6f8fa;
        --proovd-accent-color: #4C6FFF;
      }
      
      .proovd-analytics-widget[data-position="bottom-right"] {
        position: fixed;
        bottom: 20px;
        right: 20px;
      }
      
      .proovd-analytics-widget[data-position="bottom-left"] {
        position: fixed;
        bottom: 20px;
        left: 20px;
      }
      
      .proovd-analytics-widget[data-position="top-right"] {
        position: fixed;
        top: 20px;
        right: 20px;
      }
      
      .proovd-analytics-widget[data-position="top-left"] {
        position: fixed;
        top: 20px;
        left: 20px;
      }
      
      .proovd-analytics-widget[data-position="floating"] {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }
      
      .proovd-analytics-widget[data-view="compact"] {
        height: auto;
      }
      
      .proovd-analytics-widget[data-view="full"] {
        width: 600px;
        height: 400px;
      }
      
      .proovd-analytics-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        border-bottom: 1px solid var(--proovd-border-color, #e1e4e8);
      }
      
      .proovd-analytics-title {
        font-weight: 600;
        font-size: 16px;
      }
      
      .proovd-analytics-controls {
        display: flex;
        gap: 8px;
      }
      
      .proovd-analytics-controls button {
        background: none;
        border: none;
        cursor: pointer;
        width: 24px;
        height: 24px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--proovd-text-color, #333333);
        opacity: 0.7;
        transition: all 0.2s ease;
      }
      
      .proovd-analytics-controls button:hover {
        opacity: 1;
        background-color: rgba(0, 0, 0, 0.05);
      }
      
      .proovd-analytics-widget[data-theme="dark"] .proovd-analytics-controls button:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }
      
      .proovd-analytics-body {
        padding: 16px;
        overflow-y: auto;
        max-height: calc(100% - 52px);
      }
      
      .proovd-analytics-metrics {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 12px;
        margin-bottom: 16px;
      }
      
      .proovd-analytics-widget[data-view="full"] .proovd-analytics-metrics {
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      }
      
      .proovd-analytics-metric-card {
        background-color: var(--proovd-card-bg, #f6f8fa);
        border-radius: 6px;
        padding: 12px;
        text-align: center;
      }
      
      .proovd-analytics-metric-label {
        font-size: 12px;
        color: var(--proovd-text-color, #333333);
        opacity: 0.8;
        margin-bottom: 4px;
      }
      
      .proovd-analytics-metric-value {
        font-size: 18px;
        font-weight: 600;
        color: var(--proovd-accent-color, #4C6FFF);
      }
      
      .proovd-analytics-chart {
        height: 200px;
        display: none;
      }
      
      .proovd-analytics-widget[data-view="full"] .proovd-analytics-chart {
        display: block;
      }
      
      .proovd-analytics-chart-placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        background-color: var(--proovd-card-bg, #f6f8fa);
        border-radius: 6px;
        opacity: 0.6;
        font-size: 14px;
      }
      
      .proovd-analytics-footer {
        padding: 8px 16px;
        text-align: center;
        border-top: 1px solid var(--proovd-border-color, #e1e4e8);
      }
      
      .proovd-analytics-dashboard-link {
        color: var(--proovd-accent-color, #4C6FFF);
        text-decoration: none;
        font-size: 13px;
      }
      
      .proovd-analytics-dashboard-link:hover {
        text-decoration: underline;
      }
    `;
    }
}
