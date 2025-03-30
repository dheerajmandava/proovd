/**
 * ProovdPulse Widget
 * -----------------
 * Real-time website visitor tracking and engagement metrics
 * Entry point for the ProovdPulse widget
 */
export { ProovdPulse } from './proovd-pulse';
// Auto-initialize the widget if it's loaded directly (not imported)
if (typeof window !== 'undefined' && !window.location.href.includes('localhost')) {
    // Get website ID from script tag
    const scripts = document.getElementsByTagName('script');
    const currentScript = scripts[scripts.length - 1];
    let websiteId = '';
    // Extract website ID from the script URL
    if (currentScript && currentScript.src) {
        const match = currentScript.src.match(/\/websites\/([^\/]+)\/pulse-widget\.js/);
        if (match && match[1]) {
            websiteId = match[1];
            console.log('ProovdPulse: Detected website ID:', websiteId);
        }
    }
    if (websiteId) {
        // Wait for DOM to be ready
        document.addEventListener('DOMContentLoaded', async function () {
            try {
                console.log('ProovdPulse: Auto-initializing...');
                // Auto import to avoid dependency on external imports
                const { ProovdPulse } = await import('./proovd-pulse');
                // Create instance and initialize
                const pulse = new ProovdPulse({
                    websiteId: websiteId,
                    debug: true,
                    serverUrl: 'wss://socket.proovd.in',
                    container: 'body'
                });
                pulse.init().then(() => {
                    console.log('ProovdPulse: Auto-initialization successful');
                }).catch(err => {
                    console.error('ProovdPulse: Auto-initialization failed:', err);
                });
            }
            catch (error) {
                console.error('ProovdPulse: Error in auto-initialization:', error);
            }
        });
        // Fallback initialization for when DOMContentLoaded has already fired
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            setTimeout(async function () {
                try {
                    console.log('ProovdPulse: Auto-initializing (document already loaded)...');
                    // Auto import to avoid dependency on external imports
                    const { ProovdPulse } = await import('./proovd-pulse');
                    // Create instance and initialize
                    const pulse = new ProovdPulse({
                        websiteId: websiteId,
                        debug: true,
                        serverUrl: 'wss://socket.proovd.in',
                        container: 'body'
                    });
                    pulse.init().then(() => {
                        console.log('ProovdPulse: Direct initialization successful');
                    }).catch(err => {
                        console.error('ProovdPulse: Direct initialization failed:', err);
                    });
                }
                catch (error) {
                    console.error('ProovdPulse: Error in direct initialization:', error);
                }
            }, 500);
        }
    }
}
