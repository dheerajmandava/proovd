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
import { updateUserActivity, getWebsiteStats, onActiveUserChange } from '../graphql/queries';
import { GraphQLResult } from '@aws-amplify/api-graphql';

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
  themeColor?: string;
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

/**
 * Represents the structure of GraphQL responses
 */
interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{
    message: string;
    path?: string[];
  }>;
}

export class ProovdPulse {
  private container: HTMLElement | null = null;
  private tooltips: Map<string, TippyInstance> = new Map();
  private domAnalyzer: DOMAnalyzer;
  private apiUrl = window.location.origin;
  private currentUrl = window.location.href;
  private options: ProovdPulseOptions;
  private sessionId: string = '';
  private clientId: string = '';
  private websiteId: string | null = null;
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
  private updateTimer: any = null;
  private userCountElement: HTMLElement | null = null;
  
  constructor(options: ProovdPulseOptions) {
    // Store options with defaults
    this.options = {
      websiteId: options.websiteId,
      apiKey: options.apiKey || '',
      position: options.position || 'bottom-right',
      theme: options.theme || 'auto',
      sampleRate: options.sampleRate || 1.0,
      showHeatmap: options.showHeatmap !== undefined ? options.showHeatmap : true,
      showActiveUsers: options.showActiveUsers !== undefined ? options.showActiveUsers : true,
      showEngagementMetrics: options.showEngagementMetrics !== undefined ? options.showEngagementMetrics : true,
      customCSS: options.customCSS || '',
      appSyncConfig: options.appSyncConfig || {
        region: 'us-east-1',
        endpoint: '',
        apiKey: ''
      },
      themeColor: options.themeColor || '#0284c7'
    };
    
    // Set the important properties
    this.clientId = this.getClientId();
    this.websiteId = this.options.websiteId;
    
    // Create DOM analyzer
    this.domAnalyzer = new DOMAnalyzer();
    
    console.log('ProovdPulse: Initialized with options:', this.options);
    
    // Add CSS styles
    this.addStyles();
    
    // Get AppSync configuration from script attributes
    this.configureAmplify();
    
    // Initialize the widget
    this.init();
  }
  
  /**
   * Configure AWS Amplify with AppSync settings
   */
  private configureAmplify(): void {
    // Try to get AppSync config from script attributes
    const script = document.currentScript as HTMLScriptElement;
    if (script) {
      const endpoint = script.getAttribute('data-appsync-endpoint');
      const apiKey = script.getAttribute('data-appsync-api-key');
      const region = script.getAttribute('data-appsync-region');
      
      if (endpoint) this.options.appSyncConfig.endpoint = endpoint;
      if (apiKey) this.options.appSyncConfig.apiKey = apiKey;
      if (region) this.options.appSyncConfig.region = region;
    }
    
    // Configure Amplify
    Amplify.configure({
      aws_project_region: this.options.appSyncConfig.region,
      aws_appsync_graphqlEndpoint: this.options.appSyncConfig.endpoint,
      aws_appsync_region: this.options.appSyncConfig.region,
      aws_appsync_authenticationType: 'API_KEY',
      aws_appsync_apiKey: this.options.appSyncConfig.apiKey
    });
  }
  
  /**
   * Initialize the widget
   */
  private async init(): Promise<void> {
    console.log('ProovdPulse: Initializing widget...');
    
    try {
      // Create the widget container
      this.createContainer();
      
      // Initialize the analyzer
      this.domAnalyzer.init();
      
      // Fetch initial stats
      await this.fetchWebsiteStats();
      
      // Set up recurring activity reporting
      this.startActivityReporting();
      
      console.log('ProovdPulse: Initialization complete');
    } catch (error) {
      console.error('ProovdPulse: Error during initialization:', error);
    }
  }
  
  /**
   * Fetch the latest stats from the API
   */
  private async fetchWebsiteStats(): Promise<void> {
    if (!this.websiteId) {
      console.error('ProovdPulse: Cannot fetch stats - no websiteId');
      return;
    }

    try {
      console.log('ProovdPulse: Fetching website stats for', this.websiteId);
      
      // Use any type to bypass TypeScript errors for now
      const response: any = await API.graphql({
        query: getWebsiteStats,
        variables: { id: this.websiteId }
      });
      
      console.log('ProovdPulse: API response:', response);
      
      if (response.errors) {
        console.error('ProovdPulse: Error fetching stats:', response.errors);
        this.updateStatsDisplay({ activeUsers: 1 });
        return;
      }
      
      if (response.data?.getWebsiteStats) {
        console.log('ProovdPulse: Stats data:', response.data.getWebsiteStats);
        this.updateStatsDisplay(response.data.getWebsiteStats);
      } else {
        console.warn('ProovdPulse: No stats data received');
        this.updateStatsDisplay({ activeUsers: 1 });
      }
    } catch (error) {
      console.error('ProovdPulse: Failed to fetch stats:', error);
      this.updateStatsDisplay({ activeUsers: 1 });
    }
  }
  
  /**
   * Update the stats display with data
   */
  private updateStatsDisplay(data: any): void {
    console.log('ProovdPulse: Updating stats display with:', data);
    
    // Update active users count if element exists
    if (this.userCountElement) {
      const userCount = data.activeUsers || 1;
      this.userCountElement.textContent = String(userCount);
      console.log('ProovdPulse: Updated user count to:', userCount);
    } else {
      console.error('ProovdPulse: No user count element found');
    }
  }
  
  /**
   * Report user activity to the API
   */
  private async reportActivity(metrics: any): Promise<void> {
    if (!this.clientId || !this.websiteId) {
      console.error('ProovdPulse: Cannot report activity - missing clientId or websiteId');
      return;
    }

    try {
      console.log('ProovdPulse: Reporting activity with metrics:', metrics);
      
      // Use any type to bypass TypeScript errors for now
      const response: any = await API.graphql({
        query: updateUserActivity,
        variables: {
          clientId: this.clientId,
          websiteId: this.websiteId,
          metrics: metrics
        }
      });
      
      console.log('ProovdPulse: Activity report response:', response);
      
      if (response.errors) {
        console.error('ProovdPulse: Error reporting activity:', response.errors);
        return;
      }
      
      if (response.data?.updateUserActivity) {
        console.log('ProovdPulse: Activity reported successfully');
        
        // Immediately update display with the returned data
        // This is faster than calling fetchWebsiteStats again
        this.updateStatsDisplay(response.data.updateUserActivity);
      }
    } catch (error) {
      console.error('ProovdPulse: Failed to report activity:', error);
    }
  }
  
  /**
   * Create the widget container and add it to the DOM
   */
  private createContainer(): void {
    // Create main container
    this.container = document.createElement('div');
    this.container.className = 'proovd-pulse-container';
    this.container.setAttribute('data-position', this.options.position || 'bottom-right');
    
    // Apply position styles
    const positionStyles: Record<string, string> = {
      'bottom-right': 'bottom: 20px; right: 20px;',
      'bottom-left': 'bottom: 20px; left: 20px;',
      'top-right': 'top: 20px; right: 20px;',
      'top-left': 'top: 20px; left: 20px;'
    };
    
    const position = this.options.position || 'bottom-right';
    this.container.setAttribute('style', `position: fixed; z-index: 9999; ${positionStyles[position]}`);
    
    // Create widget element
    const widget = document.createElement('div');
    widget.className = 'proovd-pulse-widget';
    widget.setAttribute('style', 'background-color: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); padding: 12px; width: 220px;');
    
    // Create header
    const header = document.createElement('div');
    header.className = 'proovd-pulse-header';
    header.setAttribute('style', 'display: flex; align-items: center; margin-bottom: 8px;');
    
    // Create logo
    const logo = document.createElement('div');
    logo.className = 'proovd-pulse-logo';
    logo.setAttribute('style', 'font-weight: bold; font-size: 14px;');
    logo.textContent = 'ProovdPulse';
    
    // Add logo to header
    header.appendChild(logo);
    
    // Create content
    const content = document.createElement('div');
    content.className = 'proovd-pulse-content';
    
    // Create active users metric
    const activeUsers = document.createElement('div');
    activeUsers.className = 'proovd-pulse-metric proovd-pulse-active-users';
    activeUsers.setAttribute('style', 'font-size: 14px; margin-bottom: 10px;');
    
    // Create user count element and store reference
    const userCount = document.createElement('span');
    userCount.className = 'proovd-pulse-user-count';
    userCount.setAttribute('style', 'font-weight: bold;');
    userCount.textContent = '...';
    
    // Store reference to user count element for updating later
    this.userCountElement = userCount;
    
    // Complete the active users text
    activeUsers.appendChild(userCount);
    activeUsers.appendChild(document.createTextNode(' people viewing now'));
    
    // Add content elements
    content.appendChild(activeUsers);
    
    // Assemble widget
    widget.appendChild(header);
    widget.appendChild(content);
    
    // Add widget to container
    this.container.appendChild(widget);
    
    // Add container to document
    document.body.appendChild(this.container);
    
    console.log('ProovdPulse: Container created and added to DOM');
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
  
  /**
   * Initialize DOM analyzer for tracking user behavior
   */
  private initAnalyzer(): void {
    if (this.domAnalyzer) {
      this.domAnalyzer.init();
      console.log('ProovdPulse: Analyzer initialized');
    }
  }
  
  /**
   * Start periodic activity reporting
   */
  private startActivityReporting(): void {
    console.log('ProovdPulse: Starting activity reporting');
    
    // Initial report
    this.reportActivity({
      scrollPercentage: 0,
      timeOnPage: 0,
      clickCount: 0
    });
    
    // Set up interval for regular reporting
    setInterval(() => {
      try {
        // Get current metrics from analyzer
        const metrics = this.domAnalyzer.getMetrics();
        
        // Report to API
        this.reportActivity({
          scrollPercentage: metrics.scrollPercentage || 0,
          timeOnPage: metrics.timeOnPage || 0,
          clickCount: metrics.clickCount || 0
        });
      } catch (error) {
        console.error('ProovdPulse: Error reporting metrics:', error);
      }
    }, 40000); // Report every 40 seconds
  }
  
  /**
   * Get theme color from options or use default
   */
  private getThemeColor(): string {
    return this.options.themeColor || '#0284c7';
  }
  
  /**
   * Validate and complete options with defaults
   */
  private validateOptions(options: ProovdPulseOptions): ProovdPulseOptions {
    // Make sure we have the required fields
    if (!options.websiteId) {
      console.error('ProovdPulse: websiteId is required');
    }
    
    // Return with defaults
    return {
      websiteId: options.websiteId,
      apiKey: options.apiKey || '',
      position: options.position || 'bottom-right',
      theme: options.theme || 'auto',
      sampleRate: options.sampleRate || 1.0,
      showHeatmap: options.showHeatmap !== undefined ? options.showHeatmap : true,
      showActiveUsers: options.showActiveUsers !== undefined ? options.showActiveUsers : true,
      showEngagementMetrics: options.showEngagementMetrics !== undefined ? options.showEngagementMetrics : true,
      customCSS: options.customCSS || '',
      appSyncConfig: options.appSyncConfig || {
        region: 'us-east-1',
        endpoint: '',
        apiKey: ''
      },
      themeColor: options.themeColor || '#0284c7'
    };
  }
} 