/**
 * Proovd A/B Testing - SPA Support Script
 * 
 * For headless/SPA stores only. Intercepts Shopify API calls
 * to modify product data BEFORE frameworks read it.
 * 
 * This is optional - Liquid-based stores don't need this.
 */

interface ProovdSession {
    id: string;
    bucket: number;
    group: string;
    multiplier: number;
    testId: string;
    enabled: boolean;
    isCustomer: number | null;
}

declare global {
    interface Window {
        proovdSession?: ProovdSession;
        proovdReady?: Promise<void>;
        __proovdResolve?: () => void;
    }
}

(function () {
    'use strict';

    // Skip if not enabled or session not initialized
    if (!window.proovdSession?.enabled) {
        console.debug('[Proovd] A/B testing not enabled or session not found');
        return;
    }

    const session = window.proovdSession;
    const multiplier = session.multiplier || 1.0;

    // Create ready promise for optional blocking
    window.proovdReady = new Promise(resolve => {
        window.__proovdResolve = resolve;
    });

    // Store original fetch
    const originalFetch = window.fetch;

    /**
     * Apply price multiplier to product variants
     */
    function applyPriceMultiplier(data: any): any {
        if (!data) return data;

        // Handle single product response
        if (data.product?.variants) {
            data.product.variants = data.product.variants.map((v: any) => ({
                ...v,
                price: (parseFloat(v.price) * multiplier).toFixed(2),
                compare_at_price: v.compare_at_price
                    ? (parseFloat(v.compare_at_price) * multiplier).toFixed(2)
                    : null
            }));
        }

        // Handle collection/products response
        if (data.products) {
            data.products = data.products.map((p: any) => ({
                ...p,
                variants: p.variants?.map((v: any) => ({
                    ...v,
                    price: (parseFloat(v.price) * multiplier).toFixed(2),
                    compare_at_price: v.compare_at_price
                        ? (parseFloat(v.compare_at_price) * multiplier).toFixed(2)
                        : null
                }))
            }));
        }

        return data;
    }

    /**
     * Intercept fetch for Shopify API calls
     */
    window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
        const response = await originalFetch.call(window, input, init);
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

        // Only intercept product/collection JSON endpoints
        const isProductEndpoint = /\/products\/[^/]+\.json/.test(url);
        const isCollectionEndpoint = /\/collections\/[^/]+\/products\.json/.test(url);

        if (!isProductEndpoint && !isCollectionEndpoint) {
            return response;
        }

        try {
            const clone = response.clone();
            const data = await clone.json();
            const modifiedData = applyPriceMultiplier(data);

            // Resolve ready promise on first product intercept
            window.__proovdResolve?.();
            window.__proovdResolve = undefined;

            // Return modified response
            return new Response(JSON.stringify(modifiedData), {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers
            });
        } catch (e) {
            console.debug('[Proovd] Could not modify response:', e);
            return response;
        }
    };

    /**
     * Also intercept XMLHttpRequest for older implementations
     */
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method: string, url: string | URL, ...rest: any[]) {
        (this as any)._proovdUrl = url.toString();
        return originalXHROpen.apply(this, [method, url, ...rest] as any);
    };

    XMLHttpRequest.prototype.send = function (body?: Document | XMLHttpRequestBodyInit | null) {
        const url = (this as any)._proovdUrl || '';
        const isProductEndpoint = /\/products\/[^/]+\.json/.test(url);
        const isCollectionEndpoint = /\/collections\/[^/]+\/products\.json/.test(url);

        if (isProductEndpoint || isCollectionEndpoint) {
            this.addEventListener('load', function () {
                try {
                    const data = JSON.parse(this.responseText);
                    const modifiedData = applyPriceMultiplier(data);

                    // Override response
                    Object.defineProperty(this, 'responseText', {
                        get: () => JSON.stringify(modifiedData)
                    });
                    Object.defineProperty(this, 'response', {
                        get: () => JSON.stringify(modifiedData)
                    });
                } catch (e) {
                    console.debug('[Proovd] Could not modify XHR response:', e);
                }
            });
        }

        return originalXHRSend.call(this, body);
    };

    /**
     * Handle cart add to persist test group
     */
    const originalFormSubmit = HTMLFormElement.prototype.submit;

    document.addEventListener('submit', (e: Event) => {
        const form = e.target as HTMLFormElement;
        if (!form.action?.includes('/cart/add')) return;

        // Add proovd properties as hidden inputs
        const addHiddenInput = (name: string, value: string) => {
            let input = form.querySelector(`input[name="${name}"]`) as HTMLInputElement;
            if (!input) {
                input = document.createElement('input');
                input.type = 'hidden';
                input.name = name;
                form.appendChild(input);
            }
            input.value = value;
        };

        addHiddenInput('properties[_proovd_group]', session.group);
        addHiddenInput('properties[_proovd_test]', session.testId);

        if (multiplier !== 1.0) {
            // Note: actual price will be calculated by Shopify Function
            addHiddenInput('properties[_proovd_multiplier]', multiplier.toString());
        }
    });

    console.debug('[Proovd] SPA support initialized', { group: session.group, multiplier });
})();

export { };
