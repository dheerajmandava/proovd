import { PulseWidget } from './simple-widget.js';
import socketManager from './socket-manager.js';

// Keep track of the active instance
let widgetInstance = null;

/**
 * Initialize the ProovdPulse Widget
 */
function init(websiteId, options = {}) {
  console.log('🟢 ProovdPulse Widget Initializing...', { websiteId, options });
  
  try {
    // Destroy previous instance if it exists
    if (widgetInstance) {
      console.log('⚠️ ProovdPulse Widget already initialized, destroying previous instance');
      widgetInstance.destroy();
    }
    
    // Set socket manager debug mode
    socketManager.setDebug(options.debug || false);
    
    // Create new instance
    widgetInstance = new PulseWidget({
      websiteId,
      socketUrl: options.socketUrl || 'wss://socket.proovd.in',
      position: options.position || 'bottom-right',
      theme: options.theme || 'light',
      debug: options.debug || false,
      updateInterval: options.updateInterval || 5000
    });
    
    // Initialize widget
    widgetInstance.init()
      .then(() => {
        console.log('✅ ProovdPulse Widget initialized successfully');
      })
      .catch((error) => {
        console.error('❌ Failed to initialize ProovdPulse Widget:', error);
      });
    
    return widgetInstance;
  } catch (error) {
    console.error('❌ Failed to initialize ProovdPulse Widget:', error);
    return null;
  }
}

/**
 * Destroy the ProovdPulse Widget
 */
function destroy() {
  if (widgetInstance) {
    widgetInstance.destroy();
    widgetInstance = null;
    return true;
  }
  return false;
}

// Export public API
export default {
  init,
  destroy
}; 