/**
 * Proovd Events Client SDK
 * Allows websites to easily track various user activities for social proof notifications
 */

(function() {
  'use strict';

  // Main SDK class
  class ProovdEvents {
    constructor(options) {
      // Required options
      this.apiKey = options.apiKey;
      
      // Optional configuration
      this.endpoint = options.endpoint || 'https://www.proovd.in/api/events';
      this.debug = options.debug || false;
      this.autoTrackViews = options.autoTrackViews !== false; // Default to true
      
      // Generate and save session/client IDs
      this.sessionId = this._getSessionId();
      this.clientId = this._getClientId();
      
      // Initialize
      this._init();
    }

    /**
     * Initialize the SDK
     */
    _init() {
      this._log('Proovd Events SDK initialized');
      
      // Auto-track page views if enabled
      if (this.autoTrackViews) {
        this.trackView();
        
        // Track page changes in single-page applications
        if (typeof window !== 'undefined' && window.history) {
          const originalPushState = window.history.pushState;
          const originalReplaceState = window.history.replaceState;
          
          window.history.pushState = function() {
            originalPushState.apply(this, arguments);
            setTimeout(() => window.proovdEvents.trackView(), 300);
          };
          
          window.history.replaceState = function() {
            originalReplaceState.apply(this, arguments);
            setTimeout(() => window.proovdEvents.trackView(), 300);
          };
          
          window.addEventListener('popstate', () => {
            setTimeout(() => window.proovdEvents.trackView(), 300);
          });
        }
      }
    }

    /**
     * Track a signup event
     */
    trackSignup(data = {}) {
      this._trackEvent('/signup', {
        userName: data.name,
        userEmail: data.email,
        location: data.location,
        customData: data.customData
      });
    }

    /**
     * Track a purchase event
     */
    trackPurchase(data = {}) {
      if (!data.productName) {
        this._logError('Product name is required for purchase tracking');
        return;
      }
      
      this._trackEvent('/purchase', {
        productName: data.productName,
        productId: data.productId,
        price: data.price,
        currency: data.currency,
        userName: data.userName,
        userEmail: data.userEmail,
        location: data.location,
        customData: data.customData
      });
    }

    /**
     * Track a page view event
     */
    trackView(data = {}) {
      this._trackEvent('/view', {
        pageUrl: data.pageUrl || window.location.href,
        pageTitle: data.pageTitle || document.title,
        customData: data.customData
      });
    }

    /**
     * Track a custom event
     */
    trackCustom(name, data = {}) {
      this._trackEvent('', {
        type: 'custom',
        name: name,
        data: data
      });
    }

    /**
     * Internal method to send tracking data to the API
     */
    _trackEvent(endpoint, data) {
      // Prepare request data
      const payload = {
        apiKey: this.apiKey,
        sessionId: this.sessionId,
        clientId: this.clientId,
        ...data
      };
      
      // Log if debug mode is enabled
      this._log('Tracking event:', endpoint, payload);
      
      // Send the data to the API
      fetch(this.endpoint + endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        // Send as non-blocking request
        keepalive: true
      })
      .then(response => {
        if (!response.ok) {
          return response.json().then(data => {
            throw new Error(data.error || 'Failed to track event');
          });
        }
        return response.json();
      })
      .then(data => {
        this._log('Event tracked successfully:', data);
      })
      .catch(error => {
        this._logError('Error tracking event:', error);
      });
    }

    /**
     * Get or create a session ID
     */
    _getSessionId() {
      let sessionId = sessionStorage.getItem('proovd_session_id');
      if (!sessionId) {
        sessionId = this._generateId();
        sessionStorage.setItem('proovd_session_id', sessionId);
      }
      return sessionId;
    }

    /**
     * Get or create a client ID (persistent)
     */
    _getClientId() {
      let clientId = localStorage.getItem('proovd_client_id');
      if (!clientId) {
        clientId = this._generateId();
        localStorage.setItem('proovd_client_id', clientId);
      }
      return clientId;
    }

    /**
     * Generate a unique ID
     */
    _generateId() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }

    /**
     * Log message if debug is enabled
     */
    _log(...args) {
      if (this.debug) {
        console.log('🔍 Proovd:', ...args);
      }
    }

    /**
     * Log error
     */
    _logError(...args) {
      console.error('❌ Proovd Error:', ...args);
    }
  }

  // Add to global scope
  if (typeof window !== 'undefined') {
    window.ProovdEvents = ProovdEvents;
    
    // Auto-initialize if the script has data attributes
    const script = document.currentScript;
    if (script && script.dataset.apiKey) {
      window.proovdEvents = new ProovdEvents({
        apiKey: script.dataset.apiKey,
        debug: script.dataset.debug === 'true',
        autoTrackViews: script.dataset.autoTrackViews !== 'false',
        endpoint: script.dataset.endpoint
      });
    }
  }
})(); 