/**
 * Shopify A/B Test Configuration API
 * GET/POST /api/shopify/tests
 * 
 * Manages the proovd.tests shop metafield for A/B testing configuration
 */
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/database/connection';
import Website from '@/app/lib/models/website';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

export const dynamic = 'force-dynamic';

const METAFIELD_NAMESPACE = 'proovd';
const METAFIELD_KEY = 'tests';

// GraphQL mutation to set shop metafield
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

// GraphQL query to get shop metafield
const GET_METAFIELD_QUERY = `
  query GetShopMetafield($namespace: String!, $key: String!) {
    shop {
      metafield(namespace: $namespace, key: $key) {
        id
        namespace
        key
        value
        type
      }
    }
  }
`;

interface ShopifyGraphQLResponse {
    data?: any;
    errors?: Array<{ message: string }>;
}

async function shopifyGraphQL(shop: string, accessToken: string, query: string, variables: Record<string, any>): Promise<ShopifyGraphQLResponse> {
    const response = await fetch(`https://${shop}/admin/api/2024-10/graphql.json`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': accessToken,
        },
        body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Shopify GraphQL error: ${response.status} - ${errorText}`);
    }

    return response.json();
}

// GET - Retrieve current test configuration
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const websiteId = request.nextUrl.searchParams.get('websiteId');
        if (!websiteId) {
            return NextResponse.json({ error: 'Missing websiteId' }, { status: 400 });
        }

        await connectToDatabase();
        const website = await Website.findOne({ _id: websiteId, userId: session.user.id });

        if (!website?.shopify?.accessToken) {
            return NextResponse.json({ error: 'Shopify not connected' }, { status: 400 });
        }

        const result = await shopifyGraphQL(
            website.shopify.shop,
            website.shopify.accessToken,
            GET_METAFIELD_QUERY,
            { namespace: METAFIELD_NAMESPACE, key: METAFIELD_KEY }
        );

        if (result.errors) {
            return NextResponse.json({ error: result.errors[0].message }, { status: 500 });
        }

        const metafield = result.data?.shop?.metafield;
        if (!metafield) {
            return NextResponse.json({ tests: [] });
        }

        try {
            const config = JSON.parse(metafield.value);
            return NextResponse.json(config);
        } catch {
            return NextResponse.json({ tests: [] });
        }
    } catch (error) {
        console.error('Error fetching test config:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal error' },
            { status: 500 }
        );
    }
}

// POST - Create or update test configuration
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { websiteId, tests } = body;

        if (!websiteId) {
            return NextResponse.json({ error: 'Missing websiteId' }, { status: 400 });
        }

        if (!tests || !Array.isArray(tests)) {
            return NextResponse.json({ error: 'Invalid tests format' }, { status: 400 });
        }

        await connectToDatabase();
        const website = await Website.findOne({ _id: websiteId, userId: session.user.id });

        if (!website?.shopify?.accessToken) {
            return NextResponse.json({ error: 'Shopify not connected' }, { status: 400 });
        }

        // Create the config object
        const config = { tests };
        const configJson = JSON.stringify(config);

        const result = await shopifyGraphQL(
            website.shopify.shop,
            website.shopify.accessToken,
            SET_METAFIELD_MUTATION,
            {
                metafields: [{
                    ownerId: `gid://shopify/Shop/${website.shopify.shop.replace('.myshopify.com', '')}`,
                    namespace: METAFIELD_NAMESPACE,
                    key: METAFIELD_KEY,
                    value: configJson,
                    type: 'json',
                }]
            }
        );

        if (result.errors) {
            console.error('Shopify GraphQL errors:', result.errors);
            return NextResponse.json({ error: result.errors[0].message }, { status: 500 });
        }

        const userErrors = result.data?.metafieldsSet?.userErrors;
        if (userErrors?.length > 0) {
            console.error('Metafield user errors:', userErrors);
            return NextResponse.json({ error: userErrors[0].message }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            metafield: result.data?.metafieldsSet?.metafields?.[0]
        });
    } catch (error) {
        console.error('Error setting test config:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal error' },
            { status: 500 }
        );
    }
}
