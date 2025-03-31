/**
 * ProovdPulse Widget Entry Point
 * This is the main entry point for the ProovdPulse widget
 */

import { PulseWidget } from './pulse-ui';
import { WebsiteActivityTracker } from './activity-tracker';
import { generateClientId } from './utils';

declare global {
  interface Window {
    ProovdPulse?: {
      init: (websiteId: string, options?: any) => void;
      getInstance: () => PulseWidget | null;
      version: string;
    };
  }
}

console.log('🟢 ProovdPulse Widget Script Loaded');

let widgetInstance: PulseWidget | null = null;

/**
 * Initialize the ProovdPulse widget
 */
function init(websiteId: string, options: any = {}): PulseWidget | null {
  console.log('🟢 ProovdPulse Widget Initializing...', { websiteId, options });
  
  try {
    // Check if already initialized
    if (widgetInstance) {
      console.log('⚠️ ProovdPulse Widget already initialized, destroying previous instance');
      widgetInstance.destroy();
    }
    
    // Get client ID from storage or generate a new one
    const clientId = options.clientId || generateClientId();
    console.log('🟢 Using client ID:', clientId);
    
    // Generate websocket URL
    const socketServer = options.socketServer || 'wss://socket.proovd.in';
    console.log('🟢 Using socket server:', socketServer);
    
    // Ensure debug mode is enabled
    options.debug = true;
    
    // Create widget instance
    widgetInstance = new PulseWidget(clientId, websiteId, socketServer, options);
    
    // Connect and initialize
    console.log('🟢 Connecting to socket server...');
    widgetInstance.connect()
      .then(() => {
        console.log('✅ ProovdPulse Widget initialized successfully');
      })
      .catch(error => {
        console.error('❌ Failed to initialize ProovdPulse Widget:', error);
      });
    
    // Return the instance
    return widgetInstance;
  } catch (error) {
    console.error('❌ Failed to initialize ProovdPulse Widget:', error);
    return null;
  }
}

/**
 * Get the current widget instance
 */
function getInstance(): PulseWidget | null {
  return widgetInstance;
}

// Export the ProovdPulse object to the window
window.ProovdPulse = {
  init,
  getInstance,
  version: '1.0.0'
};

// Log info about auto init
console.log('🟢 Checking for auto-initialization...');

// Auto-initialize if data-website-id is present
const scriptTags = document.querySelectorAll('script[data-website-id]');
if (scriptTags.length > 0) {
  try {
    const scriptTag = scriptTags[0] as HTMLScriptElement;
    const websiteId = scriptTag.getAttribute('data-website-id');
    const position = scriptTag.getAttribute('data-position') || 'bottom-right';
    
    if (websiteId) {
      console.log('🟢 Auto-initializing ProovdPulse Widget with website ID:', websiteId);
      
      // Get all data attributes
      const dataAttributes: Record<string, any> = {};
      for (const attr of Array.from(scriptTag.attributes)) {
        if (attr.name.startsWith('data-') && attr.name !== 'data-website-id') {
          // Convert kebab-case to camelCase
          const optionName = attr.name.substring(5).replace(/-([a-z])/g, g => g[1].toUpperCase());
          dataAttributes[optionName] = attr.value;
        }
      }
      
      console.log('🟢 Auto-initialization options:', dataAttributes);
      
      // Initialize with the found website ID and options
      init(websiteId, {
        position,
        ...dataAttributes,
        debug: true
      });
    }
  } catch (error) {
    console.error('❌ Error during auto-initialization:', error);
  }
}

// Create a self-initializing widget for script URLs of the form: https://www.proovd.in/p/{websiteId}.js
try {
  // Get the current script
  const currentScript = document.currentScript as HTMLScriptElement;
  if (currentScript) {
    const scriptSrc = currentScript.src;
    console.log('🟢 Current script src:', scriptSrc);
    
    // Check if it follows the pattern https://www.proovd.in/p/{websiteId}.js
    const websiteIdMatch = scriptSrc.match(/\/p\/([a-zA-Z0-9]+)\.js$/);
    if (websiteIdMatch && websiteIdMatch[1]) {
      const websiteId = websiteIdMatch[1];
      console.log('🟢 Detected websiteId from script URL:', websiteId);
      
      // Initialize with the extracted website ID
      init(websiteId, {
        position: 'bottom-right',
        debug: true
      });
    }
  }
} catch (error) {
  console.error('❌ Error during URL-based initialization:', error);
}

// Export for testing
export { init, getInstance }; 