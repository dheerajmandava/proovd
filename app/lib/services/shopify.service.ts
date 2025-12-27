import { connectToDatabase } from '@/app/lib/database/connection';
import Website from '@/app/lib/models/website';
import Campaign from '@/app/lib/models/campaign';
import { mongoose } from '@/app/lib/database/connection';

const METAFIELD_NAMESPACE = 'proovd';
const METAFIELD_KEY = 'tests';

const SET_METAFIELD_MUTATION = `
  mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const GET_SHOP_ID_QUERY = `{ shop { id } }`;

/**
 * Execute a GraphQL query against Shopify Admin API
 */
async function shopifyGraphQL(shop: string, accessToken: string, query: string, variables?: any) {
    const response = await fetch(`https://${shop}/admin/api/2024-10/graphql.json`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': accessToken,
        },
        body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
        throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

/**
 * Sync active campaigns to Shopify Metafields
 */
export async function syncShopifyMetafields(siteId: string) {
    if (!siteId || !mongoose.Types.ObjectId.isValid(siteId)) return;

    await connectToDatabase();

    // 1. Fetch Website credentials
    const website = await Website.findById(siteId);
    if (!website?.shopify?.accessToken || !website?.shopify?.shop) {
        console.warn(`Sync failed: No Shopify credentials for site ${siteId}`);
        return;
    }

    // 2. Fetch Active Campaigns
    const campaigns = await Campaign.find({
        siteId,
        status: 'running' // Only sync active campaigns
    }).lean();

    // 3. Transform to Storefront JSON format
    const tests = campaigns.map((campaign: any) => {
        // Map variants to groups
        const groups = (campaign.pricingConfig?.variants || []).map((v: any) => {
            // Calculate multiplier if needed (e.g. price test)
            // For split test, we just pass the variant ID

            // Getting base price for multiplier calc is tricky if we don't store it perfect.
            // But if it's a split test, multiplier effectively is 1.0 (unless price is also different)

            // Simplification: We assume the stored 'price' and 'trafficPercent' are what matters

            return {
                id: v.id,
                weight: v.trafficPercent,
                variant_id: v.variantId,
                multiplier: 1.0 // TODO: Calculate actual multiplier if doing price test
            };
        });

        return {
            id: campaign._id.toString(),
            type: campaign.type === 'pricing' ? 'price' : 'split', // Map 'pricing' type to specific behavior
            // We can add a 'subtype' field later if needed, e.g. 'split' vs 'dynamic_price'
            // For now, let's infer 'split' if multiple variants are targeted?
            // Actually, let's just use what user defines.

            // HACK: Since current Schema only has 'pricing' type, we'll default to 'price' 
            // unless we add specific flag. For now, let's look at the variant IDs. 
            // If variants are DIFFERENT, it's a split test. If same variant ID but different price, it's price test.

            groups
        };
    });

    // Better Type Inference logic
    const testsWithTypes = tests.map((t: any) => {
        const variantIds = t.groups.map((g: any) => g.variant_id);
        const uniqueVariants = new Set(variantIds);

        // If multiple DIFFERENT Shopify variants are involved, it's a SPLIT test
        if (uniqueVariants.size > 1) {
            t.type = 'split';
        } else {
            t.type = 'price';
            // Logic to calculate multiplier would go here if we had original price reference easily accessible
        }
        return t;
    });

    const configPayload = { tests: testsWithTypes };

    try {
        // 4. Get Shop GID
        const shopRes = await shopifyGraphQL(website.shopify.shop, website.shopify.accessToken, GET_SHOP_ID_QUERY);
        const shopGid = shopRes.data?.shop?.id;

        if (!shopGid) throw new Error('Could not get Shop GID');

        // 5. Push Metafield
        const variables = {
            metafields: [{
                ownerId: shopGid,
                namespace: METAFIELD_NAMESPACE,
                key: METAFIELD_KEY,
                value: JSON.stringify(configPayload),
                type: 'json'
            }]
        };

        const result = await shopifyGraphQL(website.shopify.shop, website.shopify.accessToken, SET_METAFIELD_MUTATION, variables);

        const userErrors = result.data?.metafieldsSet?.userErrors;
        if (userErrors?.length > 0) {
            console.error('Metafield sync errors:', userErrors);
        } else {
            console.log(`Successfully synced ${campaigns.length} campaigns to ${website.shopify.shop}`);
        }

    } catch (err) {
        console.error('Failed to sync Shopify metafields:', err);
    }
}
