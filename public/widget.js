/**
 * Proovd Analytics Tracker
 * 
 * Lightweight tracker for A/B test events.
 * Social Proof functionality has been deprecated.
 */

(function () {
    let config = {};
    let apiKey = null;
    let baseUrl = 'https://proovd.in/api';

    window.Proovd = {
        init: function (key, options = {}) {
            apiKey = key;
            config = options;
            console.log('Proovd: Analytics initialized');
            this.track('pageview');
        },

        track: function (event, data = {}) {
            if (!apiKey) return;

            const payload = {
                apiKey,
                type: event,
                url: window.location.href,
                timestamp: new Date().toISOString(),
                ...data
            };

            // Use beacon if available for better reliability on exit
            if (navigator.sendBeacon) {
                const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
                navigator.sendBeacon(`${baseUrl}/track`, blob);
            } else {
                fetch(`${baseUrl}/track`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                }).catch(e => console.error('Proovd: Track error', e));
            }
        }
    };
})();
