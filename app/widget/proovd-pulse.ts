/**
 * ProovdPulse Widget
 * Social proof and engagement metrics powered by lit-html for efficient rendering
 */

import { html, render, nothing } from 'lit-html';
import { classMap } from 'lit-html/directives/class-map.js';
import { styleMap } from 'lit-html/directives/style-map.js';
import tippy, { Instance as TippyInstance } from 'tippy.js';
import 'tippy.js/dist/tippy.css';

import { DOMAnalyzer, HeatmapData } from '../lib/dom-analyzer/dom-analyzer';

// Fix for importing types
// import type { Notification } from './widget';

export interface ProovdPulseOptions {
  websiteId: string;
  apiKey?: string;
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  theme?: 'light' | 'dark' | 'auto';
  sampleRate?: number; // 0-1, percentage of users to track
  showHeatmap?: boolean;
  showActiveUsers?: boolean;
  showEngagementMetrics?: boolean;
  customCSS?: string;
}

interface EngagementData {
  activeUsers: number;
  viewCount: number;
  avgTimeOnPage: number;
  scrollPercentage: number;
  focusAreas: Array<{ selector: string; intensity: number }>;
  trend: 'up' | 'down' | 'stable';
}

export class ProovdPulse {
  private container: HTMLElement | null = null;
  private tooltips: Map<string, TippyInstance> = new Map();
  private domAnalyzer: DOMAnalyzer;
  private apiUrl = window.location.origin;
  private currentUrl = window.location.href;
  private options: Required<ProovdPulseOptions>;
  private sessionId: string;
  private clientId: string;
  private isActive = false;
  private engagementData: EngagementData = {
    activeUsers: 0,
    viewCount: 0,
    avgTimeOnPage: 0,
    scrollPercentage: 0,
    focusAreas: [],
    trend: 'stable'
  };
  private updateInterval: any = null;
  private ipData: any = null;
  
  constructor(options: ProovdPulseOptions) {
    // Set default options
    this.options = {
      websiteId: options.websiteId,
      apiKey: options.apiKey || '',
      position: options.position || 'bottom-right',
      theme: options.theme || 'auto',
      sampleRate: options.sampleRate || 1.0, // Default to tracking all users
      showHeatmap: options.showHeatmap !== undefined ? options.showHeatmap : true,
      showActiveUsers: options.showActiveUsers !== undefined ? options.showActiveUsers : true,
      showEngagementMetrics: options.showEngagementMetrics !== undefined ? options.showEngagementMetrics : true,
      customCSS: options.customCSS || '',
    };
    
    // Only initialize for the percentage of users defined in sampleRate
    if (Math.random() > this.options.sampleRate) {
      console.log('ProovdPulse: User not in sample group, widget disabled');
      return;
    }
    
    // Generate and save session/client IDs
    this.sessionId = this.getSessionId();
    this.clientId = this.getClientId();
    
    // Create DOM analyzer
    this.domAnalyzer = new DOMAnalyzer();
    
    console.log('ProovdPulse: Initialized with options:', this.options);
    
    // Add CSS styles
    this.addStyles();
    
    // Initialize the widget
    this.init();
  }
  
  /**
   * Initialize the widget
   */
  private async init(): Promise<void> {
    try {
      console.log('ProovdPulse: Initializing widget...');
      
      // Create container
      this.createContainer();
      
      // Fetch initial data
      await this.fetchEngagementData();
      
      // Start DOM analyzer
      this.domAnalyzer.start();
      
      // Start periodic updates
      this.startUpdates();
      
      // Track initial pageview
      this.trackPageview();
      
      // Widget is now active
      this.isActive = true;
      
      // Dispatch event that widget is loaded
      this.dispatchEvent('proovdPulseLoaded', { clientId: this.clientId });
      
    } catch (error) {
      console.error('ProovdPulse initialization error:', error);
      this.dispatchEvent('proovdPulseError', { message: (error as Error).message });
    }
  }
  
  /**
   * Start periodic updates
   */
  private startUpdates(): void {
    // Update engagement data every 30 seconds
    this.updateInterval = setInterval(() => {
      this.updateEngagementData();
    }, 30000);
    
    // Listen for visibility changes to pause/resume updates
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        // Page is visible again, update data
        this.updateEngagementData();
      }
    });
  }
  
  /**
   * Create widget container
   */
  private createContainer(): void {
    // Create container element
    this.container = document.createElement('div');
    this.container.className = 'proovd-pulse-container';
    this.container.setAttribute('data-theme', this.getTheme());
    
    // Set position
    switch (this.options.position) {
      case 'bottom-left':
        this.container.style.bottom = '20px';
        this.container.style.left = '20px';
        break;
      case 'bottom-right':
        this.container.style.bottom = '20px';
        this.container.style.right = '20px';
        break;
      case 'top-left':
        this.container.style.top = '20px';
        this.container.style.left = '20px';
        break;
      case 'top-right':
        this.container.style.top = '20px';
        this.container.style.right = '20px';
        break;
    }
    
    // Add container to body
    document.body.appendChild(this.container);
    
    // Initial empty render
    this.renderWidget();
  }
  
  /**
   * Add CSS styles to document
   */
  private addStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .proovd-pulse-container {
        position: fixed;
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        font-size: 14px;
        transition: all 0.3s ease;
        pointer-events: none;
      }
      
      .proovd-pulse-container * {
        pointer-events: auto;
      }
      
      .proovd-pulse-widget {
        background: var(--proovd-pulse-bg, #ffffff);
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        margin-bottom: 12px;
        border: 1px solid rgba(0, 0, 0, 0.08);
        max-width: 320px;
        transition: all 0.3s ease;
      }
      
      .proovd-pulse-container[data-theme="dark"] .proovd-pulse-widget {
        --proovd-pulse-bg: #1e1e1e;
        --proovd-pulse-text: #ffffff;
        --proovd-pulse-border: rgba(255, 255, 255, 0.1);
        --proovd-pulse-highlight: rgba(255, 255, 255, 0.05);
        color: var(--proovd-pulse-text);
        border-color: var(--proovd-pulse-border);
      }
      
      .proovd-pulse-header {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        background: var(--proovd-pulse-bg, #ffffff);
      }
      
      .proovd-pulse-logo {
        display: flex;
        align-items: center;
        font-weight: 600;
        font-size: 14px;
      }
      
      .proovd-pulse-logo-icon {
        width: 18px;
        height: 18px;
        background: #6366f1;
        color: white;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 6px;
        font-weight: 700;
      }
      
      .proovd-pulse-content {
        padding: 12px 16px;
      }
      
      .proovd-pulse-metric {
        display: flex;
        align-items: center;
        margin-bottom: 8px;
        background: var(--proovd-pulse-highlight, rgba(0, 0, 0, 0.02));
        padding: 8px 12px;
        border-radius: 6px;
      }
      
      .proovd-pulse-metric-icon {
        margin-right: 8px;
        color: #6366f1;
      }
      
      .proovd-pulse-metric-value {
        font-weight: 600;
        margin-right: 4px;
      }
      
      .proovd-pulse-metric-label {
        color: rgba(0, 0, 0, 0.6);
      }
      
      .proovd-pulse-container[data-theme="dark"] .proovd-pulse-metric-label {
        color: rgba(255, 255, 255, 0.6);
      }
      
      .proovd-pulse-heatmap {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 9998;
      }
      
      .proovd-heat-point {
        position: absolute;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255,0,0,0.8) 0%, rgba(255,0,0,0) 70%);
        transform: translate(-50%, -50%);
        pointer-events: none;
      }
      
      .proovd-pulse-trending-up {
        color: #34D399;
      }
      
      .proovd-pulse-trending-down {
        color: #F87171;
      }
      
      /* Tooltip styles */
      .tippy-box[data-theme~='proovd'] {
        background-color: #ffffff;
        color: #333;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        border-radius: 6px;
        font-size: 14px;
        padding: 8px 12px;
        max-width: 200px;
      }
      
      .tippy-box[data-theme~='proovd'] .tippy-content {
        padding: 8px;
      }
      
      .tippy-box[data-theme~='proovd'][data-placement^='top'] > .tippy-arrow::before {
        border-top-color: #ffffff;
      }
      
      /* Dark mode for tooltips */
      .proovd-pulse-container[data-theme="dark"] .tippy-box[data-theme~='proovd'] {
        background-color: #1e1e1e;
        color: #ffffff;
      }
      
      .proovd-pulse-container[data-theme="dark"] .tippy-box[data-theme~='proovd'][data-placement^='top'] > .tippy-arrow::before {
        border-top-color: #1e1e1e;
      }
      
      ${this.options.customCSS}
    `;
    
    document.head.appendChild(style);
  }
  
  /**
   * Render the widget using lit-html
   */
  private renderWidget(): void {
    if (!this.container) return;
    
    const template = html`
      ${this.options.showActiveUsers ? this.renderActiveUsersWidget() : nothing}
      ${this.options.showHeatmap && this.engagementData.focusAreas.length > 0 ? this.renderHeatmap() : nothing}
      ${this.options.showEngagementMetrics ? this.renderEngagementMetrics() : nothing}
    `;
    
    render(template, this.container);
    
    // Initialize tooltips after rendering
    this.initializeTooltips();
  }
  
  /**
   * Render active users widget
   */
  private renderActiveUsersWidget() {
    if (this.engagementData.activeUsers <= 0) return nothing;
    
    return html`
      <div class="proovd-pulse-widget proovd-pulse-active-users">
        <div class="proovd-pulse-header">
          <div class="proovd-pulse-logo">
            <div class="proovd-pulse-logo-icon">P</div>
            <span>ProovdPulse</span>
          </div>
        </div>
        <div class="proovd-pulse-content">
          <div class="proovd-pulse-metric">
            <div class="proovd-pulse-metric-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <span class="proovd-pulse-metric-value">${this.engagementData.activeUsers}</span>
            <span class="proovd-pulse-metric-label">people viewing now</span>
          </div>
          
          ${this.engagementData.viewCount > 0 ? html`
            <div class="proovd-pulse-metric">
              <div class="proovd-pulse-metric-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </div>
              <span class="proovd-pulse-metric-value">${this.engagementData.viewCount}</span>
              <span class="proovd-pulse-metric-label">views today</span>
            </div>
          ` : nothing}
        </div>
      </div>
    `;
  }
  
  /**
   * Render heatmap overlay
   */
  private renderHeatmap() {
    // Get real-time data from DOM analyzer
    const heatmapData = this.domAnalyzer.getHeatmapData();
    
    if (!heatmapData || heatmapData.points.length === 0) return nothing;
    
    return html`
      <div class="proovd-pulse-heatmap">
        ${heatmapData.points.map(point => html`
          <div class="proovd-heat-point" style=${styleMap({
            left: `${point.x}%`,
            top: `${point.y}%`,
            opacity: `${point.intensity}`
          })}></div>
        `)}
      </div>
    `;
  }
  
  /**
   * Render engagement metrics
   */
  private renderEngagementMetrics() {
    const metrics = this.domAnalyzer.getEngagementMetrics();
    
    if (!metrics) return nothing;
    
    return html`
      <div class="proovd-pulse-widget proovd-pulse-engagement">
        <div class="proovd-pulse-header">
          <div class="proovd-pulse-logo">
            <div class="proovd-pulse-logo-icon">P</div>
            <span>Engagement</span>
          </div>
        </div>
        <div class="proovd-pulse-content">
          <div class="proovd-pulse-metric">
            <div class="proovd-pulse-metric-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <span class="proovd-pulse-metric-value">${metrics.timeOnPage}s</span>
            <span class="proovd-pulse-metric-label">time on page</span>
          </div>
          
          <div class="proovd-pulse-metric">
            <div class="proovd-pulse-metric-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="8 17 12 21 16 17"></polyline>
                <line x1="12" y1="12" x2="12" y2="21"></line>
                <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"></path>
              </svg>
            </div>
            <span class="proovd-pulse-metric-value">${metrics.scrollPercentage}%</span>
            <span class="proovd-pulse-metric-label">scrolled</span>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Initialize tooltips on elements
   */
  private initializeTooltips(): void {
    // Clean up any existing tooltips
    this.tooltips.forEach(instance => {
      instance.destroy();
    });
    this.tooltips.clear();
    
    // Only add tooltips to important elements on the page
    const elements = document.querySelectorAll('button, a[href], [role="button"], input[type="submit"]');
    
    elements.forEach(element => {
      const id = this.generateElementId(element as HTMLElement);
      
      // Create tooltip - fix for tippy typing issue
      const instance = tippy(element as Element, {
        content: this.createTooltipContent(element as HTMLElement),
        theme: 'proovd',
        placement: 'top',
        trigger: 'mouseenter',
        arrow: true,
        delay: [300, 0], // Show after 300ms hover, hide immediately
        offset: [0, 10],
        animation: 'scale',
        // Only show if we have data
        onShow: (instance) => {
          const hasData = (instance.props.content as HTMLElement).childElementCount > 0;
          return hasData ? true : false; // Explicitly return true or false
        }
      });
      
      this.tooltips.set(id, instance);
    });
  }
  
  /**
   * Create tooltip content for an element
   */
  private createTooltipContent(element: HTMLElement): HTMLElement {
    const content = document.createElement('div');
    content.className = 'proovd-tooltip-content';
    
    // Get element metrics from DOM analyzer
    const metrics = this.domAnalyzer.getEngagementMetrics();
    const focusedElements = metrics.focusedElements || [];
    
    // Check if this element is in the focused elements
    const elementData = focusedElements.find(el => 
      el.selector === this.generateSelector(element) || 
      el.id === this.generateElementId(element)
    );
    
    if (elementData && elementData.interactionCount > 0) {
      content.innerHTML = `
        <div style="margin-bottom: 6px; font-weight: 600;">${element.textContent?.trim() || 'This element'}</div>
        <div style="font-size: 12px; margin-bottom: 4px;">
          <span style="font-weight: 600;">${elementData.interactionCount}</span> interactions
        </div>
      `;
    }
    
    return content;
  }
  
  /**
   * Update engagement data
   */
  private async updateEngagementData(): Promise<void> {
    try {
      // Fetch updated data from server
      await this.fetchEngagementData();
      
      // Update the widget
      this.renderWidget();
    } catch (error) {
      console.error('Error updating engagement data:', error);
    }
  }
  
  /**
   * Fetch engagement data from the server
   */
  private async fetchEngagementData(): Promise<void> {
    try {
      const metrics = this.domAnalyzer.getEngagementMetrics();
      
      // Simulate API call for now
      const randomActiveUsers = Math.floor(Math.random() * 20) + 5;
      
      this.engagementData = {
        activeUsers: randomActiveUsers,
        viewCount: Math.floor(Math.random() * 200) + 50,
        avgTimeOnPage: Math.floor(Math.random() * 180) + 30,
        scrollPercentage: metrics.scrollPercentage || 0,
        focusAreas: [],
        trend: Math.random() > 0.5 ? 'up' : 'down'
      };
    } catch (error) {
      console.error('Error fetching engagement data:', error);
      throw error;
    }
  }
  
  /**
   * Track a pageview
   */
  private async trackPageview(): Promise<void> {
    try {
      const url = `${this.apiUrl}/api/events/view`;
      
      const data = {
        apiKey: this.options.apiKey,
        websiteId: this.options.websiteId,
        sessionId: this.sessionId,
        clientId: this.clientId,
        url: this.currentUrl,
        title: document.title,
        referrer: document.referrer
      };
      
      // Send the tracking request
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        // Non-blocking request
        keepalive: true
      });
      
      if (!response.ok) {
        throw new Error(`Error tracking pageview: ${response.status}`);
      }
      
      console.log('ProovdPulse: Pageview tracked');
    } catch (error) {
      console.error('Error tracking pageview:', error);
    }
  }
  
  /**
   * Get or create a session ID
   */
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('proovd_session_id');
    if (!sessionId) {
      sessionId = this.generateId();
      sessionStorage.setItem('proovd_session_id', sessionId);
    }
    return sessionId;
  }
  
  /**
   * Get or create a client ID (persistent)
   */
  private getClientId(): string {
    let clientId = localStorage.getItem('proovd_client_id');
    if (!clientId) {
      clientId = this.generateId();
      localStorage.setItem('proovd_client_id', clientId);
    }
    return clientId;
  }
  
  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
  /**
   * Generate ID for an element
   */
  private generateElementId(element: HTMLElement): string {
    return element.id || 
      element.getAttribute('data-testid') || 
      element.getAttribute('name') || 
      `el-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Generate a CSS selector for an element
   */
  private generateSelector(element: HTMLElement): string {
    if (element.id) {
      return `#${element.id}`;
    }
    
    let selector = element.tagName.toLowerCase();
    
    if (element.className) {
      const classes = element.className.split(' ')
        .filter(c => c && !c.includes('proovd-'));
      
      if (classes.length > 0) {
        selector += '.' + classes.join('.');
      }
    }
    
    return selector;
  }
  
  /**
   * Determine theme based on options and system preference
   */
  private getTheme(): string {
    if (this.options.theme !== 'auto') {
      return this.options.theme;
    }
    
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  }
  
  /**
   * Dispatch event
   */
  private dispatchEvent(name: string, detail: any = {}): void {
    const event = new CustomEvent(name, { detail });
    window.dispatchEvent(event);
  }
  
  /**
   * Public API: Toggle heatmap visibility
   */
  public toggleHeatmap(visible?: boolean): void {
    this.options.showHeatmap = visible !== undefined ? visible : !this.options.showHeatmap;
    this.renderWidget();
  }
  
  /**
   * Public API: Toggle active users widget visibility
   */
  public toggleActiveUsers(visible?: boolean): void {
    this.options.showActiveUsers = visible !== undefined ? visible : !this.options.showActiveUsers;
    this.renderWidget();
  }
  
  /**
   * Public API: Toggle engagement metrics visibility
   */
  public toggleEngagementMetrics(visible?: boolean): void {
    this.options.showEngagementMetrics = visible !== undefined ? visible : !this.options.showEngagementMetrics;
    this.renderWidget();
  }
  
  /**
   * Public API: Destroy widget and clean up
   */
  public destroy(): void {
    // Stop DOM analyzer
    this.domAnalyzer.stop();
    
    // Clear update interval
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    // Destroy tooltips
    this.tooltips.forEach(instance => {
      instance.destroy();
    });
    
    // Remove container
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    
    // Widget is no longer active
    this.isActive = false;
    
    console.log('ProovdPulse: Widget destroyed');
  }
} 