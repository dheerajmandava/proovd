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

import { PulseSocketClient } from './socket-client';

// User activity data interface
export interface UserActivity {
  id: string;
  websiteId: string;
  sessionId: string;
  userId?: string;
  userType?: 'user' | 'guest';
  deviceInfo: {
    browser: string;
    os: string;
    device: string;
  };
  location?: {
    country?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
  lastActive: string;
  isActive: boolean;
  referrer?: string;
  path: string;
  totalClicks: number;
  scrollDepth: number;
  timeOnPage: number;
}

// Widget configuration interface
export interface PulseWidgetConfig {
  websiteId: string;
  token?: string;
  socketUrl?: string;
  widgetPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  widgetColors?: {
    background?: string;
    text?: string;
    pulse?: string;
  };
  customText?: {
    activeUserLabel?: string;
    pulseLabel?: string;
  };
  hideWidgetOnMobile?: boolean;
}

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
  private config: PulseWidgetConfig;
  private socketClient: PulseSocketClient;
  private path: string;
  private referrer: string;
  private lastScrollDepth: number = 0;
  private totalClicks: number = 0;
  private browserInfo: any = {};
  private locationInfo: any = {};
  private activityInterval: any = null;
  private isWidgetVisible: boolean = false;
  private widgetElement: HTMLElement | null = null;
  private activeUsersCount: number = 0;
  private initialized: boolean = false;
  
  constructor(config: PulseWidgetConfig) {
    this.config = this.mergeWithDefaults(config);
    this.sessionId = this.generateSessionId();
    this.path = window.location.pathname;
    this.referrer = document.referrer;
    this.startTime = Date.now();
    this.detectBrowser();
    this.socketClient = new PulseSocketClient(this.config);
    
    // Store options with defaults
    this.options = {
      websiteId: config.websiteId,
      apiKey: config.token || '',
      position: config.widgetPosition || 'bottom-right',
      theme: 'auto',
      sampleRate: config.sampleRate || 1.0,
      showHeatmap: config.widgetColors?.background !== undefined ? true : false,
      showActiveUsers: config.widgetColors?.text !== undefined ? true : false,
      showEngagementMetrics: config.widgetColors?.pulse !== undefined ? true : false,
      customCSS: config.customCSS || '',
      appSyncConfig: config.appSyncConfig || {
        region: 'us-east-1',
        endpoint: '',
        apiKey: ''
      },
      themeColor: config.widgetColors?.pulse || '#3b82f6'
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
    if (this.initialized) return;
    
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
      
      // Connect to WebSocket server
      await this.socketClient.connect();
      
      // Set up event handlers for socket events
      this.socketClient.onActiveUsersUpdate((count) => {
        this.activeUsersCount = count;
        this.updateWidgetCount(count);
      });
      
      // Setup tracking event listeners
      this.setupEventListeners();
      
      console.log('ProovdPulse: Initialization complete');
      this.initialized = true;
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
      console.log('ProovdPulse: Fetching website stats for websiteId:', this.websiteId);
      
      // Use any type to bypass TypeScript errors for now
      const response: any = await API.graphql({
        query: getWebsiteStats,
        variables: { id: this.websiteId }
      });
      
      console.log('ProovdPulse: Stats API full response:', JSON.stringify(response));
      
      if (response.errors) {
        console.error('ProovdPulse: GraphQL errors fetching stats:', response.errors);
        // Show default stats in case of error
        this.updateStatsDisplay({ activeUsers: 1 });
        return;
      }
      
      if (response.data?.getWebsiteStats) {
        console.log('ProovdPulse: Received stats data:', response.data.getWebsiteStats);
        this.updateStatsDisplay(response.data.getWebsiteStats);
      } else {
        console.warn('ProovdPulse: No stats data received, using defaults');
        
        // Create default website stats
        const defaultStats = {
          id: this.websiteId,
          activeUsers: 1,
          totalClicks: 0,
          avgScrollPercentage: 0,
          avgTimeOnPage: 0,
          updatedAt: new Date().toISOString()
        };
        
        // Update display with default stats
        this.updateStatsDisplay(defaultStats);
      }
    } catch (error) {
      console.error('ProovdPulse: Error fetching website stats:', error);
      // Show default stats in case of error
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
      console.error('ProovdPulse: Cannot report activity - missing clientId or websiteId', {
        clientId: this.clientId,
        websiteId: this.websiteId
      });
      return;
    }

    try {
      console.log('ProovdPulse: Reporting activity with metrics:', metrics);
      console.log('ProovdPulse: Using websiteId:', this.websiteId);
      console.log('ProovdPulse: Using clientId:', this.clientId);
      
      // Use any type to bypass TypeScript errors for now
      const response: any = await API.graphql({
        query: updateUserActivity,
        variables: {
          clientId: this.clientId,
          websiteId: this.websiteId,
          metrics: metrics
        }
      });
      
      console.log('ProovdPulse: Activity report full response:', JSON.stringify(response));
      
      if (response.errors) {
        console.error('ProovdPulse: GraphQL errors reporting activity:', response.errors);
        return;
      }
      
      if (response.data?.updateUserActivity) {
        console.log('ProovdPulse: Activity reported successfully');
        console.log('ProovdPulse: Updated stats:', response.data.updateUserActivity);
        
        // Immediately update display with the returned data
        this.updateStatsDisplay(response.data.updateUserActivity);
      } else {
        console.error('ProovdPulse: Null response from updateUserActivity', response);
        // Fetch stats as a fallback
        this.fetchWebsiteStats();
      }
    } catch (error) {
      console.error('ProovdPulse: Failed to report activity:', error);
      
      // Try to fetch stats directly as a fallback
      setTimeout(() => this.fetchWebsiteStats(), 2000);
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

  /**
   * Merge provided configuration with defaults
   */
  private mergeWithDefaults(config: PulseWidgetConfig): PulseWidgetConfig {
    return {
      websiteId: config.websiteId,
      token: config.token || '',
      socketUrl: config.socketUrl || 'wss://socket.proovd.in',
      widgetPosition: config.widgetPosition || 'bottom-right',
      widgetColors: {
        background: config.widgetColors?.background || '#1e293b',
        text: config.widgetColors?.text || '#ffffff',
        pulse: config.widgetColors?.pulse || '#3b82f6',
      },
      customText: {
        activeUserLabel: config.customText?.activeUserLabel || 'Active Users',
        pulseLabel: config.customText?.pulseLabel || 'Proovd Pulse',
      },
      hideWidgetOnMobile: config.hideWidgetOnMobile !== undefined ? config.hideWidgetOnMobile : true,
    };
  }

  /**
   * Setup event listeners for tracking
   */
  private setupEventListeners(): void {
    // Click tracking
    document.addEventListener('click', () => {
      this.totalClicks++;
      this.reportActivity();
    });

    // Scroll tracking
    window.addEventListener('scroll', this.throttle(() => {
      this.trackScrollDepth();
    }, 500));

    // Visibility change
    document.addEventListener('visibilitychange', () => {
      this.reportActivity();
    });

    // Before unload
    window.addEventListener('beforeunload', () => {
      this.reportActivity(false);
    });
  }

  /**
   * Track scroll depth percentage
   */
  private trackScrollDepth(): void {
    const windowHeight = window.innerHeight;
    const documentHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight,
      document.body.clientHeight,
      document.documentElement.clientHeight
    );
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    
    if (documentHeight > windowHeight) {
      const scrollPercent = Math.floor((scrollTop / (documentHeight - windowHeight)) * 100);
      this.lastScrollDepth = Math.max(scrollPercent, this.lastScrollDepth);
    }
  }

  /**
   * Throttle function to limit execution frequency
   */
  private throttle(callback: Function, delay: number): any {
    let lastCall = 0;
    return function(...args: any[]) {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        callback(...args);
      }
    };
  }

  /**
   * Detect browser, OS, and device
   */
  private detectBrowser(): void {
    const userAgent = navigator.userAgent;
    let browser = 'Unknown';
    let os = 'Unknown';
    let device = 'Desktop';

    // Detect browser
    if (userAgent.indexOf('Firefox') > -1) {
      browser = 'Firefox';
    } else if (userAgent.indexOf('SamsungBrowser') > -1) {
      browser = 'Samsung Browser';
    } else if (userAgent.indexOf('Opera') > -1 || userAgent.indexOf('OPR') > -1) {
      browser = 'Opera';
    } else if (userAgent.indexOf('Edge') > -1) {
      browser = 'Edge';
    } else if (userAgent.indexOf('Chrome') > -1) {
      browser = 'Chrome';
    } else if (userAgent.indexOf('Safari') > -1) {
      browser = 'Safari';
    } else if (userAgent.indexOf('MSIE') > -1 || userAgent.indexOf('Trident/') > -1) {
      browser = 'Internet Explorer';
    }

    // Detect OS
    if (userAgent.indexOf('Windows') > -1) {
      os = 'Windows';
    } else if (userAgent.indexOf('Mac') > -1) {
      os = 'MacOS';
    } else if (userAgent.indexOf('Linux') > -1) {
      os = 'Linux';
    } else if (userAgent.indexOf('Android') > -1) {
      os = 'Android';
    } else if (userAgent.indexOf('iOS') > -1 || (navigator.platform === 'iPhone' || navigator.platform === 'iPad' || navigator.platform === 'iPod')) {
      os = 'iOS';
    }

    // Detect device
    if (window.innerWidth <= 768 || userAgent.indexOf('Mobile') > -1 || userAgent.indexOf('Android') > -1 && userAgent.indexOf('Mozilla/5.0') > -1) {
      device = 'Mobile';
    } else if (window.innerWidth <= 1024 || navigator.platform === 'iPad' || userAgent.indexOf('Tablet') > -1) {
      device = 'Tablet';
    }

    this.browserInfo = { browser, os, device };

    // Get location info from API if available
    this.getLocationInfo();
  }

  /**
   * Get user location information (Optional - only used if available)
   */
  private getLocationInfo(): void {
    try {
      fetch('https://geolocation-db.com/json/')
        .then(response => response.json())
        .then(data => {
          this.locationInfo = {
            country: data.country_name,
            city: data.city,
            latitude: data.latitude,
            longitude: data.longitude
          };
        })
        .catch(() => {
          // Silently fail if geolocation is not available
          this.locationInfo = {};
        });
    } catch (error) {
      // Silently fail if fetch is not available
      this.locationInfo = {};
    }
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Create and display the widget
   */
  private createWidget(): void {
    if (this.isWidgetVisible || this.widgetElement) return;
    
    // Do not show widget on mobile if configured that way
    if (this.config.hideWidgetOnMobile && this.browserInfo.device === 'Mobile') {
      return;
    }

    // Create widget container
    const widget = document.createElement('div');
    widget.className = 'proovd-pulse-widget';
    widget.style.position = 'fixed';
    widget.style.zIndex = '9999';
    widget.style.padding = '8px 12px';
    widget.style.borderRadius = '50px';
    widget.style.backgroundColor = this.config.widgetColors?.background || '#1e293b';
    widget.style.color = this.config.widgetColors?.text || '#ffffff';
    widget.style.fontFamily = 'Arial, sans-serif';
    widget.style.fontSize = '14px';
    widget.style.display = 'flex';
    widget.style.alignItems = 'center';
    widget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
    widget.style.transition = 'opacity 0.3s';
    widget.style.opacity = '0.9';
    widget.style.cursor = 'pointer';

    // Set position
    switch (this.config.widgetPosition) {
      case 'bottom-left':
        widget.style.bottom = '20px';
        widget.style.left = '20px';
        break;
      case 'top-right':
        widget.style.top = '20px';
        widget.style.right = '20px';
        break;
      case 'top-left':
        widget.style.top = '20px';
        widget.style.left = '20px';
        break;
      default:
        widget.style.bottom = '20px';
        widget.style.right = '20px';
    }

    // Hover effect
    widget.addEventListener('mouseenter', () => {
      widget.style.opacity = '1';
    });
    widget.addEventListener('mouseleave', () => {
      widget.style.opacity = '0.9';
    });

    // Pulse indicator
    const pulse = document.createElement('div');
    pulse.className = 'proovd-pulse-indicator';
    pulse.style.width = '12px';
    pulse.style.height = '12px';
    pulse.style.borderRadius = '50%';
    pulse.style.backgroundColor = this.config.widgetColors?.pulse || '#3b82f6';
    pulse.style.marginRight = '8px';
    pulse.style.position = 'relative';

    // Pulse animation
    const pulseAnimation = document.createElement('style');
    pulseAnimation.textContent = `
      @keyframes pulse {
        0% {
          transform: scale(0.95);
          box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
        }
        70% {
          transform: scale(1);
          box-shadow: 0 0 0 6px rgba(59, 130, 246, 0);
        }
        100% {
          transform: scale(0.95);
          box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
        }
      }
      .proovd-pulse-indicator {
        animation: pulse 2s infinite;
      }
    `;
    document.head.appendChild(pulseAnimation);

    // Counter
    const counter = document.createElement('div');
    counter.className = 'proovd-pulse-counter';

    // Active user count
    const countElement = document.createElement('div');
    countElement.className = 'proovd-pulse-count';
    countElement.style.fontWeight = 'bold';
    countElement.textContent = '1';

    // Label
    const labelElement = document.createElement('div');
    labelElement.className = 'proovd-pulse-label';
    labelElement.style.fontSize = '12px';
    labelElement.style.marginLeft = '4px';
    labelElement.textContent = this.config.customText?.activeUserLabel || 'Active Users';

    // Powered by label
    const poweredBy = document.createElement('div');
    poweredBy.className = 'proovd-pulse-powered';
    poweredBy.style.fontSize = '10px';
    poweredBy.style.marginLeft = '8px';
    poweredBy.style.opacity = '0.7';
    poweredBy.textContent = this.config.customText?.pulseLabel || 'Proovd Pulse';

    // Assemble widget
    counter.appendChild(countElement);
    counter.appendChild(labelElement);
    widget.appendChild(pulse);
    widget.appendChild(counter);
    widget.appendChild(poweredBy);

    // Add click handler to open Proovd dashboard in new tab
    widget.addEventListener('click', () => {
      window.open('https://app.proovd.in/dashboard', '_blank');
    });

    // Append to document
    document.body.appendChild(widget);
    this.widgetElement = widget;
    this.isWidgetVisible = true;
  }

  /**
   * Update widget with current active user count
   */
  private updateWidgetCount(count: number): void {
    if (this.widgetElement) {
      const countElement = this.widgetElement.querySelector('.proovd-pulse-count');
      if (countElement) {
        countElement.textContent = count.toString();
      }
    }
  }

  /**
   * Check if the script is running in an iframe
   */
  private isInIframe(): boolean {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  }

  /**
   * Clean up event listeners and intervals
   */
  public cleanup(): void {
    // Clear reporting interval
    if (this.activityInterval) {
      clearInterval(this.activityInterval);
    }

    // Send final update
    this.reportActivity(false);

    // Close WebSocket connection
    this.socketClient.disconnect();

    // Remove widget
    if (this.widgetElement && this.widgetElement.parentNode) {
      this.widgetElement.parentNode.removeChild(this.widgetElement);
      this.widgetElement = null;
      this.isWidgetVisible = false;
    }

    // Mark as not initialized
    this.initialized = false;
  }
} 