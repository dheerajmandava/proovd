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

    // 2. Fetch All Campaigns for this site to sync state
    const campaigns = await Campaign.find({
        siteId
    }).lean();

    // 3. Filter for active tests to be sent to Shopify
    const activeCampaigns = campaigns.filter((c: any) => c.status === 'running');

    // 4. Transform ONLY active campaigns to Storefront JSON format
    const tests = activeCampaigns.map((campaign: any) => {
        // Map variants to groups
        const groups = (campaign.pricingConfig?.variants || []).map((v: any) => {
            return {
                id: v._id?.toString() || v.variantId,
                weight: v.trafficPercent,
                variant_id: v.variantId,
                multiplier: 1.0,
                price: v.price
            };
        });

        return {
            id: campaign._id.toString(),
            product_id: campaign.pricingConfig?.productId,
            product_handle: campaign.pricingConfig?.productHandle,
            type: 'ab-test', // Unified type as requested
            status: 'active',
            groups
        };
    });

    console.log(`Payload for ${website.shopify.shop}:`, JSON.stringify({ tests }, null, 2));

    const configPayload = { tests };

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
