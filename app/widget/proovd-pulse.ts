/**
 * ProovdPulse Widget
 * Social proof and engagement metrics powered by lit-html for efficient rendering
 */

import { html, render, nothing } from 'lit-html';
import { classMap } from 'lit-html/directives/class-map.js';
import { styleMap } from 'lit-html/directives/style-map.js';
import tippy, { Instance as TippyInstance } from 'tippy.js';
import 'tippy.js/dist/tippy.css';

// Import AWS Amplify for AppSync integration
import { Amplify, API, graphqlOperation } from 'aws-amplify';

import { DOMAnalyzer, HeatmapData } from '../lib/dom-analyzer/dom-analyzer';
import * as queries from '../graphql/queries';

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
  appSyncConfig?: {
    region: string;
    endpoint: string;
    apiKey: string;
  };
  debug?: boolean;
}

interface EngagementData {
  activeUsers: number;
  viewCount: number;
  avgTimeOnPage: number;
  scrollPercentage: number;
  focusAreas: Array<{ selector: string; intensity: number }>;
  trend: 'up' | 'down' | 'stable';
  usersByCountry?: Record<string, number>;
  usersByCity?: Record<string, number>;
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
    trend: 'stable',
    usersByCountry: {},
    usersByCity: {}
  };
  private updateInterval: any = null;
  private ipData: any = null;
  private subscription: any = null;
  private metrics = {
    scrollPercentage: 0,
    timeOnPage: 0,
    clickCount: 0
  };
  private startTime = new Date();
  private debug: boolean = false;
  
  constructor(options: ProovdPulseOptions) {
    // Default options
    this.options = {
      websiteId: '',
      position: 'bottom-right',
      theme: 'auto',
      showActiveUsers: true,
      showEngagementMetrics: true,
      showHeatmap: false,
      debug: false,
      ...options
    };
    
    this.debug = !!this.options.debug;
    
    // Debug initialization
    this.logDebug('ProovdPulse initializing with options:', this.options);
    
    // Client ID for tracking
    this.clientId = this.getClientId();
    this.logDebug('Client ID:', this.clientId);
    
    // Start tracking
    this.initialize();
  }
  
  /**
   * Log debug messages if debug mode is enabled
   */
  private logDebug(...args: any[]): void {
    if (this.debug) {
      console.log('%cProovdPulse Debug:', 'background: #6366f1; color: white; padding: 2px 4px; border-radius: 2px;', ...args);
    }
  }
  
  /**
   * Log errors with more visibility
   */
  private logError(...args: any[]): void {
    console.error('%cProovdPulse Error:', 'background: #ef4444; color: white; padding: 2px 4px; border-radius: 2px;', ...args);
  }
  
  /**
   * Initialize AWS Amplify
   */
  private async initAmplify(): Promise<void> {
    this.logDebug('Initializing AWS Amplify with configuration:', {
      endpoint: this.options.appSyncConfig?.endpoint ? this.options.appSyncConfig.endpoint.substring(0, 15) + '...' : 'missing',
      apiKey: this.options.appSyncConfig?.apiKey ? '***' + (this.options.appSyncConfig.apiKey.substring(this.options.appSyncConfig.apiKey.length - 5)) : 'missing',
      region: this.options.appSyncConfig?.region || 'us-east-1'
    });
    
    if (!this.options.appSyncConfig?.endpoint || !this.options.appSyncConfig?.apiKey) {
      this.logError('Missing AppSync configuration', {
        endpoint: !!this.options.appSyncConfig?.endpoint,
        apiKey: !!this.options.appSyncConfig?.apiKey
      });
      
      // Update UI to show connection error
      this.updateUserCountDisplay('Error: Configuration missing');
      throw new Error('Missing AppSync configuration');
    }
    
    try {
      // Configure AWS Amplify
      Amplify.configure({
        aws_project_region: this.options.appSyncConfig.region || 'us-east-1',
        aws_appsync_graphqlEndpoint: this.options.appSyncConfig.endpoint,
        aws_appsync_region: this.options.appSyncConfig.region || 'us-east-1',
        aws_appsync_authenticationType: 'API_KEY',
        aws_appsync_apiKey: this.options.appSyncConfig.apiKey,
        Analytics: {
          disabled: true
        }
      });
      
      this.logDebug('Amplify initialized successfully');
    } catch (error) {
      this.logError('Error initializing Amplify:', error);
      
      // Update UI to show connection error
      this.updateUserCountDisplay('Connection Error');
      throw error;
    }
  }
  
  /**
   * Initialize widget
   */
  private async initialize(): Promise<void> {
    try {
      this.logDebug('Starting initialization...');
      
      // Initialize AWS Amplify for AppSync
      await this.initAmplify();
      
      // Create widget container
      this.createContainer();
      
      // Add styles
      this.addStyles();
      
      // Subscribe to active users
      if (this.options.showActiveUsers) {
        this.logDebug('Setting up active users subscription');
        await this.subscribeToActiveUsers();
      }
      
      // Initialize engagement metrics
      if (this.options.showEngagementMetrics) {
        this.logDebug('Setting up engagement metrics');
        this.initializeEngagementMetrics();
      }
      
      // Initialize heatmap
      if (this.options.showHeatmap) {
        this.logDebug('Setting up heatmap');
        this.initializeHeatmap();
      }
      
      // Initialize DOM observer
      this.initDomObserver();
      
      // Track pageview
      await this.trackPageview();
      
      // Set up periodic updates
      this.setupPeriodicUpdates();
      
      this.logDebug('Initialization completed successfully');
    } catch (error) {
      this.logError('Error initializing ProovdPulse:', error);
      
      // Show error in the widget
      this.updateUserCountDisplay('Connection Error');
    }
  }
  
  /**
   * Subscribe to active users
   */
  private async subscribeToActiveUsers(): Promise<void> {
    try {
      if (!this.options.websiteId) {
        this.logError('Missing websiteId for subscription');
        return;
      }
      
      this.logDebug('Subscribing to active users for websiteId:', this.options.websiteId);
      
      // Subscribe to changes in active users
      const subscription = API.graphql(
        graphqlOperation(
          queries.onActiveUserChange,
          { websiteId: this.options.websiteId }
        )
      );
      
      if ('subscribe' in subscription) {
        this.subscription = subscription.subscribe({
          next: (data: any) => {
            this.logDebug('Received subscription update:', data);
            
            const payload = data.value.data.onActiveUserChange;
            if (payload) {
              this.updateStats(payload);
            } else {
              this.logDebug('Subscription payload was empty or undefined');
            }
          },
          error: (error: any) => {
            this.logError('Subscription error:', error);
            
            // Update UI to show subscription error
            this.updateUserCountDisplay('Live updates disconnected');
          }
        });
        
        this.logDebug('Subscription set up successfully');
      } else {
        this.logError('Subscription object does not have a subscribe method');
      }
    } catch (error) {
      this.logError('Error setting up subscription:', error);
      
      // Update UI to show subscription error
      this.updateUserCountDisplay('Live updates unavailable');
    }
  }
  
  /**
   * Update user count display with custom message
   */
  private updateUserCountDisplay(message: string): void {
    if (this.container) {
      const userCountElement = this.container.querySelector('.proovd-pulse-active-users .proovd-pulse-metric-value');
      if (userCountElement) {
        userCountElement.textContent = message;
        userCountElement.style.color = '#ef4444'; // Error color
      }
    }
  }
  
  /**
   * Update engagement data and send metrics
   */
  private async updateEngagementData(): Promise<void> {
    try {
      // Update internal metrics
      this.updateMetrics();
      
      if (!API) {
        this.logError('API not initialized');
        return;
      }
      
      if (!this.clientId || !this.options.websiteId) {
        this.logError('Missing clientId or websiteId', {
          clientId: this.clientId,
          websiteId: this.options.websiteId
        });
        return;
      }
      
      const metricsData = {
        scrollPercentage: this.metrics.scrollPercentage,
        timeOnPage: this.metrics.timeOnPage,
        clickCount: this.metrics.clickCount
      };
      
      this.logDebug('Sending metrics to AppSync:', {
        clientId: this.clientId,
        websiteId: this.options.websiteId,
        metrics: metricsData
      });
      
      // Send updated metrics to AppSync
      const response = await API.graphql(
        graphqlOperation(
          queries.updateUserActivity,
          {
            clientId: this.clientId,
            websiteId: this.options.websiteId,
            metrics: metricsData
          }
        )
      );
      
      this.logDebug('updateUserActivity response:', response);
      
      // Check response for errors or null values
      if (response && response.data && response.data.updateUserActivity === null) {
        this.logError('updateUserActivity returned null. Possible server-side error.');
      }
    } catch (error) {
      this.logError('Error updating engagement data:', error);
      
      // Retry after a delay if it's a network issue
      if (error.message && (error.message.includes('Network') || error.message.includes('Failed to fetch'))) {
        this.logDebug('Will retry after delay');
        setTimeout(() => this.updateEngagementData(), 30000); // Retry after 30 seconds
      }
    }
  }
  
  /**
   * Track pageview
   */
  private async trackPageview(): Promise<void> {
    try {
      this.logDebug('Tracking pageview');
      
      if (!API) {
        this.logError('API not initialized');
        return;
      }
      
      if (!this.clientId || !this.options.websiteId) {
        this.logError('Missing clientId or websiteId', {
          clientId: this.clientId,
          websiteId: this.options.websiteId
        });
        return;
      }
      
      this.logDebug('Sending initial pageview to AppSync:', {
        clientId: this.clientId,
        websiteId: this.options.websiteId
      });
      
      // Send initial metrics to AppSync
      const response = await API.graphql(
        graphqlOperation(
          queries.updateUserActivity,
          {
            clientId: this.clientId,
            websiteId: this.options.websiteId,
            metrics: {
              scrollPercentage: 0,
              timeOnPage: 0,
              clickCount: 0
            }
          }
        )
      );
      
      this.logDebug('Initial trackPageview response:', response);
      
      // Check response for errors or null values
      if (response && response.data && response.data.updateUserActivity === null) {
        this.logError('trackPageview returned null. Possible server-side error.');
        this.updateUserCountDisplay('Data connection issue');
      }
    } catch (error) {
      this.logError('Error tracking pageview:', error);
      
      // Update UI to show error
      this.updateUserCountDisplay('Connection issue');
      
      // Retry after a delay if it's a network issue
      if (error.message && (error.message.includes('Network') || error.message.includes('Failed to fetch'))) {
        this.logDebug('Will retry pageview after delay');
        setTimeout(() => this.trackPageview(), 10000); // Retry after 10 seconds
      }
    }
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
    // Clean up DOM analyzer
    if (this.domAnalyzer) {
      this.domAnalyzer.stop();
    }
    
    // Clear update interval
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    // Unsubscribe from real-time updates
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    
    // Remove visibility event listener
    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    
    // Remove container
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    
    // Clear tooltips
    this.tooltips.forEach((tooltip) => {
      tooltip.destroy();
    });
    
    console.log('ProovdPulse: Widget destroyed');
  }
} 