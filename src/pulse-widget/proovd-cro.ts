/**
 * Proovd CRO Widget - Shopify Pricing Edition
 * A/B Testing for Price Points on Shopify
 * 
 * This is a focused widget for price-point testing on Shopify stores.
 * It uses real Shopify product variants (not DOM manipulation) for
 * checkout-safe, policy-compliant pricing experiments.
 */
import { ShopifyVariantSelector } from './shopify/variant-selector';

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
    status: string;
    pricingConfig: PricingConfig;
}

interface ProovdOptions {
    /** Your website/project ID (optional if shopDomain is provided) */
    websiteId?: string;

    /** Shopify shop domain (e.g., 'store.myshopify.com') */
    shopDomain?: string;

    /** Optional: Custom API endpoint */
    apiUrl?: string;

    /** Enable debug logging */
    debug?: boolean;
}

export class ProovdCRO {
    private options: ProovdOptions;
    private isInitialized: boolean = false;

    constructor(options: ProovdOptions) {
        this.options = {
            debug: false,
            ...options
        };

        // Set default API URL
        if (!this.options.apiUrl) {
            const isProduction = typeof window !== 'undefined'
                && window.location.hostname !== 'localhost'
                && !window.location.hostname.includes('127.0.0.1');
            this.options.apiUrl = isProduction
                ? 'https://proovd.in/api'
                : 'http://localhost:3000/api';
        }

        this.log('ProovdCRO initialized with options:', this.options);
    }

    /**
     * Initialize the pricing system
     */
    async init(): Promise<void> {
        if (this.isInitialized) {
            this.log('Already initialized');
            return;
        }

        try {
            // Fetch pricing campaigns from API
            const campaigns = await this.fetchCampaigns();

            if (campaigns.length === 0) {
                this.log('No active pricing campaigns found');
                return;
            }

            // Execute each pricing campaign
            for (const campaign of campaigns) {
                this.executePricingCampaign(campaign);
            }

            this.isInitialized = true;
            this.log('ProovdCRO initialized successfully');

        } catch (error) {
            console.error('ProovdCRO: Failed to initialize', error);
        }
    }

    /**
     * Fetch active pricing campaigns from the API
     * Supports lookup by websiteId or shop domain
     */
    private async fetchCampaigns(): Promise<PricingCampaign[]> {
        // Build query params - either websiteId or shop domain
        let queryParams = '';
        if (this.options.websiteId) {
            queryParams = `siteId=${this.options.websiteId}`;
        } else if (this.options.shopDomain) {
            queryParams = `shop=${this.options.shopDomain}`;
        } else {
            this.log('No websiteId or shop domain available');
            return [];
        }

        try {
            const endpoint = `${this.options.apiUrl}/campaigns?${queryParams}&type=pricing`;
            this.log('Fetching campaigns from:', endpoint);
            const response = await fetch(endpoint);
            const data = await response.json();

            if (data.success && Array.isArray(data.campaigns)) {
                // Filter for active pricing campaigns only
                const pricingCampaigns = data.campaigns.filter(
                    (c: any) => c.type === 'pricing' && ['active', 'running'].includes(c.status) && c.pricingConfig
                );
                this.log(`Found ${pricingCampaigns.length} active pricing campaigns`);
                return pricingCampaigns;
            }
            return [];
        } catch (error) {
            console.error('ProovdCRO: Failed to fetch campaigns', error);
            return [];
        }
    }

    /**
     * Execute a pricing campaign
     */
    private executePricingCampaign(campaign: any): void {
        const campaignId = campaign.id || campaign._id;

        if (!campaign.pricingConfig?.variants?.length) {
            this.log(`Campaign ${campaignId} has no variants. Skipping.`);
            return;
        }

        this.log(`Executing pricing campaign: ${campaignId}`);

        const selector = new ShopifyVariantSelector({
            id: campaignId,
            type: 'pricing',
            pricingConfig: campaign.pricingConfig
        });

        const assignedVariant = selector.execute();

        if (assignedVariant) {
            this.log(`Assigned variant: ${assignedVariant.variantId} (${assignedVariant.name})`);

            // Track impression
            this.trackImpression(campaignId, assignedVariant);
        }
    }

    /**
     * Track a pricing impression
     */
    private async trackImpression(campaignId: string, variant: PricingVariant): Promise<void> {
        try {
            await fetch(`${this.options.apiUrl}/track`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    siteId: this.options.websiteId,
                    campaignId,
                    eventType: 'impression',
                    variantId: variant.variantId,
                    price: variant.price,
                    cost: variant.cost || 0
                })
            });
        } catch (e) {
            console.error('[Proovd] Failed to track impression:', e);
        }
    }

    /**
     * Debug logging
     */
    private log(...args: any[]): void {
        if (this.options.debug) {
            console.log('[ProovdCRO]', ...args);
        }
    }
}

// Auto-initialize from script tag or URL params
if (typeof window !== 'undefined') {
    const script = document.currentScript as HTMLScriptElement;

    // Try to get shop domain from script URL (Shopify adds ?shop=xxx automatically)
    let shopDomain: string | null = null;
    if (script?.src) {
        try {
            const scriptUrl = new URL(script.src);
            shopDomain = scriptUrl.searchParams.get('shop');
        } catch (e) {
            // Ignore URL parsing errors
        }
    }

    // Get websiteId from data attribute if available
    const websiteId = script?.dataset?.websiteId;

    // Initialize if we have either websiteId or shopDomain
    if (websiteId || shopDomain) {
        const proovd = new ProovdCRO({
            websiteId: websiteId,
            shopDomain: shopDomain || undefined,
            apiUrl: script?.dataset?.apiUrl,
            debug: script?.dataset?.debug === 'true' || true // Enable debug for now
        });
        proovd.init();
        (window as any).proovd = proovd;
        console.log('[Proovd] Auto-initialized with:', { websiteId, shopDomain });
    } else {
        console.warn('[Proovd] No websiteId or shop domain found. Widget will not initialize.');
    }
}

export default ProovdCRO;
