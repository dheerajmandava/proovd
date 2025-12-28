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

            // 2. Variant Enforcement (Split/AB Test)
            if (this.config.targetVariant) {
                this.enforceVariant(this.config.targetVariant);
            }

            // 3. Price Test Logic (when a custom price is configured)
            if (this.config.price && this.config.price > 0) {
                this.enforcePrice(this.config.multiplier);
            }

            // 4. Analytics Tracking
            this.trackImpression();

            // Remove anti-flicker after short delay
            setTimeout(() => this.removeAntiFlicker(), 500);
        }

        async trackImpression() {
            if (!this.config.testId || this.config.group === 'control') return;

            try {
                // Determine current host for API
                const apiHost = 'https://proovd.in'; // Production default

                await fetch(`${apiHost}/api/track`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        shop: window.Shopify?.shop,
                        websiteId: this.config.websiteId,
                        campaignId: this.config.testId,
                        type: 'impression',
                        data: {
                            variantId: this.config.targetVariant,
                            group: this.config.group
                        },
                        sessionId: this.config.id,
                        url: window.location.href,
                        referrer: document.referrer
                    })
                });
                console.log('Proovd: Impression tracked');
            } catch (e) {
                console.warn('Proovd: Tracking failed', e);
            }
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
            // 1. Selector-based hiding (Standard inputs/options)
            const selectors = [
                `input[name="id"][value]:not([value="${allowedVariantId}"])`, // Radio
                `option[value]:not([value="${allowedVariantId}"])`, // Dropdown
                `a[href*="variant="]:not([href*="${allowedVariantId}"])`, // Links
                `[data-variant-id]:not([data-variant-id="${allowedVariantId}"])`, // Data attr
                `[data-variant]:not([data-variant="${allowedVariantId}"])` // Data attr
            ];

            selectors.forEach(selector => {
                document.querySelectorAll(selector).forEach(el => {
                    this.hardHide(el);

                    // Hide associated labels for inputs (swatches/pills)
                    if (el.tagName === 'INPUT' && el.id) {
                        const label = document.querySelector(`label[for="${el.id}"]`);
                        if (label) this.hardHide(label);
                    }

                    // Also try to find a parent pill/swatch container if it's a data-attr
                    if (el.hasAttribute('data-variant-id') || el.hasAttribute('data-variant')) {
                        const parent = el.closest('.swatch-element, .swatch__item, .product-form__input');
                        if (parent && !parent.querySelector(`[data-variant-id="${allowedVariantId}"], [data-variant="${allowedVariantId}"]`)) {
                            this.hardHide(parent);
                        }
                    }
                });
            });

            // 2. Force click/select the target variant if needed
            const targetInput = document.querySelector(`input[value="${allowedVariantId}"]`);
            if (targetInput && !targetInput.checked) {
                targetInput.checked = true;
                targetInput.click();
                this.dispatchLegacyEvents(allowedVariantId);
            }

            const targetOption = document.querySelector(`option[value="${allowedVariantId}"]`);
            if (targetOption && !targetOption.selected) {
                targetOption.selected = true;
                targetOption.parentElement.dispatchEvent(new Event('change', { bubbles: true }));
                this.dispatchLegacyEvents(allowedVariantId);
            }

            const targetData = document.querySelector(`[data-variant-id="${allowedVariantId}"], [data-variant="${allowedVariantId}"]`);
            if (targetData) {
                // only click if not "active" class
                if (!targetData.classList.contains('active') && !targetData.classList.contains('selected')) {
                    targetData.click();
                    this.dispatchLegacyEvents(allowedVariantId);
                }
            }

            if (!targetInput && !targetOption && !targetData) {
                console.warn(`[Proovd] CRITICAL: Target Variant ${allowedVariantId} was not found on this page. Check if IDs match your current store.`);
            }
        }

        dispatchLegacyEvents(variantId) {
            // Match the old widget's event dispatching
            window.dispatchEvent(new CustomEvent("variant:change", { detail: { variant: { id: parseInt(variantId) } } }));
            document.dispatchEvent(new CustomEvent("shopify:variant:change", { detail: { variantId: variantId } }));
        }

        hardHide(el) {
            el.style.setProperty('display', 'none', 'important');
            el.style.setProperty('opacity', '0', 'important');
            el.style.setProperty('pointer-events', 'none', 'important');
            el.setAttribute('hidden', '');
            el.classList.add('proovd-hidden');
        }

        /**
         * PRICE TEST: Find price elements and replace with test price
         * Uses the `price` value from config (set per-group in metafield)
         */
        enforcePrice(multiplier) {
            const testPrice = this.config.price; // Direct price from metafield group
            if (!testPrice) {
                console.warn('[Proovd] Price test configured but no price value found in config.');
                return;
            }

            console.log(`[Proovd] Enforcing test price: ${testPrice}`);

            // Common Shopify price selectors
            const priceSelectors = [
                '.price__regular .price-item--regular',
                '.price-item--regular',
                '.product__price',
                '.product-single__price',
                '[data-product-price]',
                '[data-price]',
                '.price .money',
                '.product-price',
                '.current-price',
                '.ProductMeta__Price',
                '.product__info-price .price',
                '.product-form__price',
                '.product__price--regular',
                '.price-container .price',
                '.price__current',
                'span.money',
                '.shopify-price',
                '.product-card__price'
            ];

            // Get currency format from Shopify
            const formatMoney = (cents) => {
                const format = window.Shopify?.currency?.format || '${{amount}}';
                const amount = (cents / 100).toFixed(2);
                return format
                    .replace('{{amount}}', amount)
                    .replace('{{amount_no_decimals}}', Math.round(cents / 100))
                    .replace('{{amount_with_comma_separator}}', amount.replace('.', ','))
                    .replace('{{amount_no_decimals_with_comma_separator}}', Math.round(cents / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'));
            };

            // Convert test price to cents if not already
            const priceInCents = testPrice > 1000 ? testPrice : testPrice * 100;
            const formattedPrice = formatMoney(priceInCents);

            // Replace prices
            const replacePrices = () => {
                priceSelectors.forEach(selector => {
                    document.querySelectorAll(selector).forEach(el => {
                        // Skip if already processed or is inside a cart/checkout
                        if (el.dataset.proovdProcessed) return;
                        if (el.closest('.cart, .cart-drawer, #cart, .mini-cart')) return;

                        // Only process if on product page or in product card matching our product
                        const productContainer = el.closest('[data-product-id], .product, .product-card, .product-single');
                        if (productContainer) {
                            const containerId = productContainer.dataset?.productId;
                            // If container has a product ID and it doesn't match, skip
                            if (containerId && this.config._debug?.metafieldRaw?.tests?.[0]?.product_id) {
                                const testProductId = this.config._debug.metafieldRaw.tests[0].product_id;
                                if (containerId !== testProductId && !testProductId.includes(containerId)) {
                                    return;
                                }
                            }
                        }

                        // Store original for potential rollback
                        if (!el.dataset.proovdOriginal) {
                            el.dataset.proovdOriginal = el.textContent;
                        }

                        // Replace text content
                        el.textContent = formattedPrice;
                        el.dataset.proovdProcessed = 'true';
                        console.log('[Proovd] Replaced price:', el);
                    });
                });
            };

            // Initial replacement
            replacePrices();

            // Watch for dynamic content changes
            const observer = new MutationObserver(() => {
                replacePrices();
            });
            observer.observe(document.body, { childList: true, subtree: true });
        }
    }

    // Start
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => new ProovdEngine());
    } else {
        new ProovdEngine();
    }
})();
