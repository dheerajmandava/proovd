/**
 * Script to initialize A/B test configuration on a Shopify store
 * 
 * Run: npx ts-node scripts/init-ab-test.ts <websiteId>
 * 
 * This sets up a sample A/B test configuration in the store's metafields
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import Website from '../app/lib/models/website';

const MONGODB_URI = process.env.MONGODB_URI || '';

const DEFAULT_TEST_CONFIG = {
    tests: [
        {
            id: 'price-test-1',
            status: 'active',
            groups: [
                { id: 'control', weight: 50, multiplier: 1.0 },
                { id: 'discount-10', weight: 50, multiplier: 0.9 }
            ],
            audience: {
                device: 'all',
                country: 'all',
                customerOnly: false
            }
        }
    ]
};

const SET_METAFIELD_MUTATION = `
  mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        id
        namespace
        key
        value
      }
      userErrors {
        field
        message
      }
    }
  }
`;

async function initABTest(websiteId?: string) {
    if (!MONGODB_URI) {
        console.error('MONGODB_URI not set');
        process.exit(1);
    }

    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find websites with Shopify connected
    const query = websiteId
        ? { _id: websiteId, 'shopify.accessToken': { $exists: true } }
        : { 'shopify.accessToken': { $exists: true } };

    const websites = await Website.find(query);
    console.log(`Found ${websites.length} Shopify-connected websites`);

    for (const website of websites) {
        const { shop, accessToken } = website.shopify;
        console.log(`\nProcessing: ${shop}`);

        try {
            // Get shop ID first
            const shopIdResponse = await fetch(`https://${shop}/admin/api/2024-10/graphql.json`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Shopify-Access-Token': accessToken,
                },
                body: JSON.stringify({
                    query: `{ shop { id } }`
                }),
            });

            const shopIdData = await shopIdResponse.json();
            const shopGid = shopIdData.data?.shop?.id;

            if (!shopGid) {
                console.error(`  Could not get shop ID for ${shop}`);
                continue;
            }

            console.log(`  Shop GID: ${shopGid}`);

            // Set the metafield
            const response = await fetch(`https://${shop}/admin/api/2024-10/graphql.json`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Shopify-Access-Token': accessToken,
                },
                body: JSON.stringify({
                    query: SET_METAFIELD_MUTATION,
                    variables: {
                        metafields: [{
                            ownerId: shopGid,
                            namespace: 'proovd',
                            key: 'tests',
                            value: JSON.stringify(DEFAULT_TEST_CONFIG),
                            type: 'json',
                        }]
                    }
                }),
            });

            const result = await response.json();

            if (result.errors) {
                console.error(`  GraphQL errors:`, result.errors);
            } else if (result.data?.metafieldsSet?.userErrors?.length > 0) {
                console.error(`  User errors:`, result.data.metafieldsSet.userErrors);
            } else {
                console.log(`  ✅ Metafield set successfully!`);
                console.log(`  Metafield ID: ${result.data?.metafieldsSet?.metafields?.[0]?.id}`);
            }
        } catch (error) {
            console.error(`  Error: ${error}`);
        }
    }

    await mongoose.disconnect();
    console.log('\nDone!');
}

const websiteId = process.argv[2];
initABTest(websiteId);
