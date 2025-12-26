/**
 * Shopify GraphQL Client
 * Wrapper around @shopify/shopify-api for fetching products/variants
 */
import { getShopify } from './config';
import { ApiVersion } from '@shopify/shopify-api';

interface ShopifyProduct {
    id: string;
    title: string;
    handle: string;
    status: string;
    variants: ShopifyVariant[];
    featuredImage?: {
        url: string;
        altText: string;
    };
}

interface ShopifyVariant {
    id: string;
    title: string;
    price: string;
    sku: string;
    inventoryQuantity: number;
    availableForSale: boolean;
}

export class ShopifyClient {
    private shop: string;
    private accessToken: string;

    constructor(shop: string, accessToken: string) {
        this.shop = shop;
        this.accessToken = accessToken;
    }

    /**
     * Execute a GraphQL query against Shopify Admin API
     */
    async query<T = any>(query: string, variables?: Record<string, any>): Promise<T> {
        const shopify = getShopify();

        // Create a proper Session object
        // We need to import Session from the library, but since we can't easily change imports here without
        // potentially breaking things, we'll rely on the fact that we're passing a compatible object
        // or try to access the Session class if available on the shopify instance, 
        // but standard way is usually just passing the object if it matches the interface.
        // However, v12 might be strict.
        // Let's try using client.request which is the modern API.

        const client = new shopify.clients.Graphql({
            session: {
                id: `offline_${this.shop}`,
                shop: this.shop,
                state: '',
                isOnline: false,
                accessToken: this.accessToken,
            } as any,
        });

        try {
            // Use .request() instead of .query() as .query() is deprecated/removed in v12
            const response = await client.request(query, {
                variables,
            });

            console.log('GRAPHQL RESPONSE KEYS:', Object.keys(response));
            if (response.data) {
                console.log('GRAPHQL DATA KEYS:', Object.keys(response.data));
            }

            // In v12+, response.data contains the result, not response.body
            return response.data as T;
        } catch (error: any) {
            console.error('Shopify GraphQL Error:', error);
            if (error.response) {
                console.error('Response details:', JSON.stringify(error.response, null, 2));
            }
            throw error;
        }
    }

    /**
     * Fetch all products with their variants
     */
    async getProducts(first: number = 50): Promise<ShopifyProduct[]> {
        const query = `
            query GetProducts($first: Int!) {
                products(first: $first, sortKey: TITLE) {
                    edges {
                        node {
                            id
                            title
                            handle
                            status
                            featuredImage {
                                url
                                altText
                            }
                            variants(first: 100) {
                                edges {
                                    node {
                                        id
                                        title
                                        price
                                        sku
                                        inventoryQuantity
                                        availableForSale
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const response = await this.query<{
            products: {
                edges: Array<{
                    node: {
                        id: string;
                        title: string;
                        handle: string;
                        status: string;
                        featuredImage?: { url: string; altText: string };
                        variants: {
                            edges: Array<{
                                node: ShopifyVariant;
                            }>;
                        };
                    };
                }>;
            };
        }>(query, { first });

        return response.products.edges.map(({ node }) => ({
            id: node.id,
            title: node.title,
            handle: node.handle,
            status: node.status,
            featuredImage: node.featuredImage,
            variants: node.variants.edges.map(({ node: v }) => ({
                id: v.id,
                title: v.title,
                price: v.price,
                sku: v.sku,
                inventoryQuantity: v.inventoryQuantity,
                availableForSale: v.availableForSale,
            })),
        }));
    }

    /**
     * Fetch a single product by handle
     */
    async getProductByHandle(handle: string): Promise<ShopifyProduct | null> {
        const query = `
            query GetProductByHandle($handle: String!) {
                productByHandle(handle: $handle) {
                    id
                    title
                    handle
                    status
                    featuredImage {
                        url
                        altText
                    }
                    variants(first: 100) {
                        edges {
                            node {
                                id
                                title
                                price
                                sku
                                inventoryQuantity
                                availableForSale
                            }
                        }
                    }
                }
            }
        `;

        const response = await this.query<{
            productByHandle: {
                id: string;
                title: string;
                handle: string;
                status: string;
                featuredImage?: { url: string; altText: string };
                variants: {
                    edges: Array<{
                        node: ShopifyVariant;
                    }>;
                };
            } | null;
        }>(query, { handle });

        if (!response.productByHandle) return null;

        const node = response.productByHandle;
        return {
            id: node.id,
            title: node.title,
            handle: node.handle,
            status: node.status,
            featuredImage: node.featuredImage,
            variants: node.variants.edges.map(({ node: v }) => ({
                id: v.id,
                title: v.title,
                price: v.price,
                sku: v.sku,
                inventoryQuantity: v.inventoryQuantity,
                availableForSale: v.availableForSale,
            })),
        };
    }

    /**
     * Get shop info
     */
    async getShopInfo(): Promise<{ name: string; email: string; domain: string }> {
        const query = `
            query {
                shop {
                    name
                    email
                    primaryDomain {
                        host
                    }
                }
            }
        `;

        const response = await this.query<{
            shop: {
                name: string;
                email: string;
                primaryDomain: { host: string };
            };
        }>(query);

        return {
            name: response.shop.name,
            email: response.shop.email,
            domain: response.shop.primaryDomain.host,
        };
    }
}

export type { ShopifyProduct, ShopifyVariant };
