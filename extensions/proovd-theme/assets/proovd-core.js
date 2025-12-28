/**
 * Proovd Core Engine v2
 * Product-Aware A/B Testing for Prices
 * Works on homepage, collections, product pages - everywhere
 */

(function () {
    const SESSION_ID = 'proovd-session';

    // ==========================================
    // PRODUCT LOCATOR - Find product context for any DOM element
    // ==========================================
    class ProductLocator {
        /**
         * Find product ID and handle for any element
         * Uses multiple strategies like ABsolutely
         */
        static find(element) {
            let result = { productId: null, productHandle: null, variantId: null };

            // Strategy 1: Direct data attributes
            result = this.mergeData(result, this.fromDataAttributes(element));
            if (result.productId && result.productHandle) return result;

            // Strategy 2: Ancestor with data attributes
            result = this.mergeData(result, this.fromAncestors(element));
            if (result.productId && result.productHandle) return result;

            // Strategy 3: Ancestor anchor link
            result = this.mergeData(result, this.fromAnchorLinks(element));
            if (result.productId && result.productHandle) return result;

            // Strategy 4: Form with variant input
            result = this.mergeData(result, this.fromParentForm(element));

            return result;
        }

        static fromDataAttributes(el) {
            const productId = el.dataset.productId || el.dataset.product;
            const productHandle = el.dataset.productHandle || el.dataset.handle;
            const variantId = el.dataset.variantId || el.dataset.variant;
            return { productId, productHandle, variantId };
        }

        static fromAncestors(el, depth = 5) {
            let current = el;
            for (let i = 0; i < depth && current; i++) {
                current = current.parentElement;
                if (!current) break;

                const data = this.fromDataAttributes(current);
                if (data.productId || data.productHandle) return data;

                // Check for JSON data in data-product attribute
                if (current.dataset.product) {
                    try {
                        const json = JSON.parse(current.dataset.product);
                        if (json.id) return { productId: String(json.id), productHandle: json.handle };
                    } catch (e) { }
                }
            }
            return {};
        }

        static fromAnchorLinks(el, depth = 6) {
            let current = el;
            for (let i = 0; i < depth && current; i++) {
                current = current.parentElement;
                if (!current) break;

                // Find anchor link in this element or its children
                const anchor = current.tagName === 'A' ? current : current.querySelector('a[href*="/products/"]');
                if (anchor && anchor.href) {
                    const match = anchor.href.match(/\/products\/([^?#/]+)/);
                    if (match) {
                        return { productHandle: decodeURIComponent(match[1]) };
                    }
                }
            }
            return {};
        }

        static fromParentForm(el) {
            const form = el.closest('form[action*="/cart/add"]');
            if (!form) return {};

            const variantInput = form.querySelector('input[name="id"], select[name="id"]');
            if (variantInput) {
                return { variantId: variantInput.value };
            }
            return {};
        }

        static mergeData(existing, newData) {
            return {
                productId: existing.productId || newData.productId || null,
                productHandle: existing.productHandle || newData.productHandle || null,
                variantId: existing.variantId || newData.variantId || null
            };
        }
    }

    // ==========================================
    // PRICE REPLACER - Apply test prices to elements
    // ==========================================
    class PriceReplacer {
        constructor(config) {
            this.config = config;
            this.tests = config.tests || [];
            this.bucket = config.bucket;
            this.testGroups = {}; // Cache: testId -> groupId

            // Pre-calculate which group user belongs to for each test
            this.tests.forEach(test => {
                this.testGroups[test.id] = this.calculateGroup(test);
            });
        }

        calculateGroup(test) {
            let cumulative = 0;
            for (const group of (test.groups || [])) {
                cumulative += (group.weight || 0);
                if (this.bucket < cumulative) {
                    return group;
                }
            }
            return test.groups?.[0] || null;
        }

        findTestForProduct(productHandle, productId) {
            return this.tests.find(test => {
                // Match by handle or ID
                if (test.product_handle && test.product_handle === productHandle) return true;
                if (test.product_id && test.product_id === productId) return true;
                // Also check if productId is in the GID format
                if (test.product_id && productId && test.product_id.includes(productId)) return true;
                return false;
            });
        }

        getTestPrice(test) {
            const group = this.testGroups[test.id];
            return group?.price || null;
        }

        formatPrice(priceInCents) {
            // Convert to dollars for display
            const amount = (priceInCents / 100).toFixed(2);
            const format = window.Shopify?.currency?.active
                ? `$${amount}`
                : `$${amount}`;
            return format;
        }

        replaceAll() {
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
                '.product-form__price',
                '.price__current',
                'span.money',
                '.product-card__price',
                '.card__information .price',
                '.price--regular'
            ];

            const elements = document.querySelectorAll(priceSelectors.join(','));
            console.log(`[Proovd] Found ${elements.length} price elements to check`);

            elements.forEach(el => {
                // Skip if already processed or in cart
                if (el.dataset.proovdProcessed) return;
                if (el.closest('.cart, .cart-drawer, #cart, .mini-cart, #CartDrawer')) return;

                // Find product context
                const productData = ProductLocator.find(el);

                if (!productData.productHandle && !productData.productId) {
                    // console.log('[Proovd] No product context for:', el);
                    return;
                }

                // Find matching test
                const test = this.findTestForProduct(productData.productHandle, productData.productId);
                if (!test) {
                    // console.log('[Proovd] No test for product:', productData);
                    return;
                }

                // Get test price
                const testPrice = this.getTestPrice(test);
                if (!testPrice || testPrice <= 0) {
                    console.log('[Proovd] No valid test price for:', test.id);
                    return;
                }

                // Store original
                if (!el.dataset.proovdOriginal) {
                    el.dataset.proovdOriginal = el.textContent;
                }

                // Apply price
                const priceInCents = testPrice > 1000 ? testPrice : testPrice * 100;
                const formattedPrice = this.formatPrice(priceInCents);

                el.textContent = formattedPrice;
                el.dataset.proovdProcessed = 'true';
                console.log(`[Proovd] Replaced price for ${productData.productHandle}:`, formattedPrice);
            });
        }
    }

    // ==========================================
    // PROOVD ENGINE - Main orchestrator
    // ==========================================
    class ProovdEngine {
        constructor() {
            this.config = this.loadConfig();
            if (!this.config || !this.config.enabled) {
                console.log('[Proovd] No active tests or disabled');
                return;
            }

            this.priceReplacer = new PriceReplacer(this.config);
            this.init();
        }

        loadConfig() {
            try {
                const el = document.getElementById(SESSION_ID);
                return el ? JSON.parse(el.textContent) : null;
            } catch (e) {
                console.error('[Proovd] Failed to load config', e);
                return null;
            }
        }

        init() {
            console.log('[Proovd] Engine starting with', this.config.tests?.length || 0, 'tests');

            // 1. Initial price replacement
            this.priceReplacer.replaceAll();

            // 2. Watch for dynamic content
            const observer = new MutationObserver(() => {
                this.priceReplacer.replaceAll();
            });
            observer.observe(document.body, { childList: true, subtree: true });

            // 3. Track impression if on product page with active test
            if (this.config.currentProduct?.handle) {
                const test = this.priceReplacer.findTestForProduct(
                    this.config.currentProduct.handle,
                    this.config.currentProduct.id
                );
                if (test) {
                    this.trackImpression(test);
                }
            }
        }

        async trackImpression(test) {
            try {
                const group = this.priceReplacer.testGroups[test.id];
                const apiHost = 'https://proovd.in';

                await fetch(`${apiHost}/api/track`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        shop: window.Shopify?.shop,
                        campaignId: test.id,
                        type: 'impression',
                        data: {
                            groupId: group?.id,
                            productHandle: test.product_handle
                        },
                        sessionId: this.config.id,
                        url: window.location.href
                    })
                });
                console.log('[Proovd] Impression tracked for test:', test.id);
            } catch (e) {
                console.warn('[Proovd] Tracking failed', e);
            }
        }
    }

    // Start
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => new ProovdEngine());
    } else {
        new ProovdEngine();
    }
})();
