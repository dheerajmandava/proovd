/**
 * Shopify Variant Selector
 * Forces selection of a specific product variant on Shopify PDP pages.
 * Used for price-point A/B testing.
 */

interface PricingVariant {
    variantId: string;
    name: string;
    price: number;
    cost?: number;
    trafficPercent: number;
}

interface PricingConfig {
    productId: string;
    productHandle: string;
    productUrl: string;
    variants: PricingVariant[];
}

interface PricingCampaign {
    id: string;
    type: 'pricing';
    pricingConfig: PricingConfig;
}

const STORAGE_KEY_PREFIX = 'proovd_pricing_';

export class ShopifyVariantSelector {
    private campaign: PricingCampaign;
    private assignedVariant: PricingVariant | null = null;

    constructor(campaign: PricingCampaign) {
        this.campaign = campaign;
    }

    /**
     * Check if current page matches the product
     */
    isProductPage(): boolean {
        const { productHandle, productUrl } = this.campaign.pricingConfig;
        const currentUrl = window.location.href;
        const currentPath = window.location.pathname;

        // Match by handle in URL path
        if (productHandle && currentPath.includes(`/products/${productHandle}`)) {
            return true;
        }

        // Match by full URL
        if (productUrl && currentUrl.includes(productUrl)) {
            return true;
        }

        // Match by Shopify product page pattern
        if (currentPath.match(/\/products\/[^\/]+$/)) {
            return true;
        }

        return false;
    }

    /**
     * Get or assign a variant for this visitor
     */
    getAssignedVariant(): PricingVariant {
        const storageKey = `${STORAGE_KEY_PREFIX}${this.campaign.id}`;

        // Check for existing assignment
        const stored = localStorage.getItem(storageKey);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                const variant = this.campaign.pricingConfig.variants.find(
                    v => v.variantId === parsed.variantId
                );

                // Only use stored variant if it exists AND has traffic > 0
                // This allows "kill switching" a variant by setting it to 0%
                if (variant && variant.trafficPercent > 0) {
                    this.assignedVariant = variant;
                    return variant;
                }
            } catch (e) {
                // Invalid stored data, reassign
            }
        }

        // Assign new variant based on traffic split
        const variant = this.selectVariantByTraffic();

        // Safety check: if no variant returned (empty config), stop
        if (!variant) return null as any;

        this.assignedVariant = variant;

        // Persist assignment
        localStorage.setItem(storageKey, JSON.stringify({
            variantId: variant.variantId,
            assignedAt: Date.now()
        }));

        return variant;
    }

    /**
     * Select variant based on traffic percentages
     */
    private selectVariantByTraffic(): PricingVariant {
        const variants = this.campaign.pricingConfig.variants;

        if (!variants || variants.length === 0) return null as any;

        const random = Math.random() * 100;
        let cumulative = 0;

        for (const variant of variants) {
            cumulative += variant.trafficPercent;
            if (random <= cumulative) {
                return variant;
            }
        }

        // Fallback to first variant if loop finishes (or all 0%)
        return variants[0];
    }

    /**
     * Force Shopify to select the assigned variant
     */
    forceVariantSelection(variant: PricingVariant): void {
        const variantId = variant.variantId;

        // Method 1: Update URL with variant parameter
        this.updateUrlWithVariant(variantId);

        // Method 2: Trigger Shopify's variant selector
        this.triggerVariantChange(variantId);

        // Method 3: Dispatch custom event for theme compatibility
        this.dispatchVariantChangeEvent(variantId);

        console.log(`[Proovd] Forced variant selection: ${variantId} (${variant.name})`);
    }

    /**
     * Update URL to include variant ID
     */
    private updateUrlWithVariant(variantId: string): void {
        const url = new URL(window.location.href);
        url.searchParams.set('variant', variantId);

        // Use replaceState to avoid adding to history
        window.history.replaceState({}, '', url.toString());
    }

    /**
     * Trigger Shopify's native variant change
     */
    private triggerVariantChange(variantId: string): void {
        // Try to find and click the variant option
        const variantSelect = document.querySelector('select[name="id"]') as HTMLSelectElement;
        if (variantSelect) {
            variantSelect.value = variantId;
            variantSelect.dispatchEvent(new Event('change', { bubbles: true }));
            return;
        }

        // Try radio buttons (common in some themes)
        const variantRadio = document.querySelector(
            `input[name="id"][value="${variantId}"]`
        ) as HTMLInputElement;
        if (variantRadio) {
            variantRadio.checked = true;
            variantRadio.dispatchEvent(new Event('change', { bubbles: true }));
            return;
        }

        // Try variant buttons (Dawn theme style)
        const variantButton = document.querySelector(
            `[data-variant-id="${variantId}"], [data-option-value][data-variant="${variantId}"]`
        ) as HTMLElement;
        if (variantButton) {
            variantButton.click();
        }
    }

    /**
     * Dispatch custom event for theme compatibility
     */
    private dispatchVariantChangeEvent(variantId: string): void {
        // Shopify themes often listen for this event
        window.dispatchEvent(new CustomEvent('variant:change', {
            detail: { variant: { id: parseInt(variantId) } }
        }));

        // Also dispatch on document for some themes
        document.dispatchEvent(new CustomEvent('shopify:variant:change', {
            detail: { variantId }
        }));
    }

    /**
     * Main execution method
     */
    execute(): PricingVariant | null {
        if (!this.isProductPage()) {
            return null;
        }

        const variant = this.getAssignedVariant();

        if (!variant) return null; // Safe exit if no variant found

        // Wait for DOM to be ready, then force selection
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.forceVariantSelection(variant);
            });
        } else {
            // Small delay to ensure Shopify's JS has initialized
            setTimeout(() => {
                this.forceVariantSelection(variant);
            }, 100);
        }

        return variant;
    }

    /**
     * Track impression for this variant
     */
    async trackImpression(apiUrl: string, siteId: string): Promise<void> {
        if (!this.assignedVariant) return;

        try {
            await fetch(`${apiUrl}/track`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    siteId,
                    campaignId: this.campaign.id,
                    eventType: 'impression',
                    variantId: this.assignedVariant.variantId,
                    price: this.assignedVariant.price,
                    cost: this.assignedVariant.cost || 0
                })
            });
        } catch (e) {
            console.error('[Proovd] Failed to track impression:', e);
        }
    }
}

export default ShopifyVariantSelector;
