/**
 * Proovd Core Engine
 * Handles Split Testing (Variant Hiding) and Price Enforcement
 */

(function () {
    const SESSION_ID = 'proovd-session';

    class ProovdEngine {
        constructor() {
            this.config = this.loadConfig();
            if (!this.config || !this.config.enabled) return;

            this.init();
        }

        loadConfig() {
            try {
                const el = document.getElementById(SESSION_ID);
                return el ? JSON.parse(el.textContent) : null;
            } catch (e) {
                console.error('Proovd: Failed to load config', e);
                return null;
            }
        }

        init() {
            console.log('Proovd: specialized engine starting', this.config);

            // 1. Anti-Flicker (Immediate)
            this.injectAntiFlickerStyle();

            // 2. Split Test Logic
            if (this.config.testType === 'split_test' && this.config.targetVariant) {
                this.enforceVariant(this.config.targetVariant);
            }

            // 3. Price Test Logic
            if (this.config.multiplier !== 1.0) {
                this.enforcePrice(this.config.multiplier);
            }

            // Remove anti-flicker after short delay
            setTimeout(() => this.removeAntiFlicker(), 500);
        }

        injectAntiFlickerStyle() {
            const css = `
        .proovd-hidden { opacity: 0 !important; pointer-events: none !important; }
        [data-proovd-hide] { display: none !important; }
      `;
            const style = document.createElement('style');
            style.id = 'proovd-style';
            style.textContent = css;
            document.head.appendChild(style);
        }

        removeAntiFlicker() {
            // reveal content
        }

        /**
         * SPLIT TEST: Ensure user only sees and interacts with the target variant
         */
        enforceVariant(targetVariantId) {
            const currentUrl = new URL(window.location.href);
            const currentVariant = currentUrl.searchParams.get('variant');

            // A. URL Enforcement
            // If no variant in URL, or wrong variant, redirect/replace state
            if (currentVariant && currentVariant !== targetVariantId) {
                // Update URL without reload if possible, or trigger reload if needed by theme
                const newUrl = new URL(window.location.href);
                newUrl.searchParams.set('variant', targetVariantId);
                window.history.replaceState({}, '', newUrl);

                // Some themes need a reload or click to update UI
                // We typically try to "click" the variant selector instead of reloading page
            }

            // B. Selector Hiding
            // Find all inputs/options that correspond to OTHER variants and hide them
            this.hideOtherVariants(targetVariantId);

            // Watch for DOM changes to keep hiding them
            const observer = new MutationObserver(() => {
                this.hideOtherVariants(targetVariantId);
            });
            observer.observe(document.body, { childList: true, subtree: true });
        }

        hideOtherVariants(allowedVariantId) {
            // Common selectors for Shopify themes
            const selectors = [
                `input[name="id"][value]:not([value="${allowedVariantId}"])`, // Radio buttons
                `option[value]:not([value="${allowedVariantId}"])`, // Dropdown options
                `a[href*="variant="]:not([href*="${allowedVariantId}"])` // Link swatches
            ];

            selectors.forEach(selector => {
                document.querySelectorAll(selector).forEach(el => {
                    // If it's a radio label, we often need to hide the parent or label
                    if (el.tagName === 'INPUT') {
                        const label = document.querySelector(`label[for="${el.id}"]`);
                        if (label) label.style.display = 'none';
                        el.style.display = 'none';
                    }

                    if (el.tagName === 'OPTION') {
                        el.remove(); // Actually remove options to prevent selection
                    }

                    if (el.tagName === 'A') {
                        el.style.display = 'none';
                    }
                });
            });
        }

        /**
         * PRICE TEST: Enforce calculated price
         */
        enforcePrice(multiplier) {
            // TODO: Port robust price manipulation logic here
        }
    }

    // Start
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => new ProovdEngine());
    } else {
        new ProovdEngine();
    }
})();
