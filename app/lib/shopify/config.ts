/**
 * Shopify API Configuration
 * Uses @shopify/shopify-api for OAuth and Admin API access
 * Lazy-loaded to avoid build-time errors when env vars are missing
 */
import { shopifyApi, Session, ApiVersion } from '@shopify/shopify-api';
import '@shopify/shopify-api/adapters/node';

// Singleton instance
let shopifyInstance: ReturnType<typeof shopifyApi> | null = null;

/**
 * Get or create Shopify API instance
 * Throws if credentials are missing at runtime
 */
export function getShopify() {
    if (shopifyInstance) return shopifyInstance;

    const clientId = process.env.SHOPIFY_CLIENT_ID;
    const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error('Shopify credentials not configured. Set SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET.');
    }

    shopifyInstance = shopifyApi({
        apiKey: clientId,
        apiSecretKey: clientSecret,
        scopes: ['read_products'],
        hostName: process.env.SHOPIFY_HOST || 'localhost:3457/graphiql',
        hostScheme: process.env.NODE_ENV === 'production' ? 'https' : 'http',
        apiVersion: ApiVersion.October24,
        isEmbeddedApp: true,
    });

    return shopifyInstance;
}

// Session storage (in-memory for now, use Redis/DB in production)
const sessionStore = new Map<string, Session>();

export const sessionStorage = {
    storeSession: async (session: Session): Promise<boolean> => {
        sessionStore.set(session.id, session);
        return true;
    },
    loadSession: async (id: string): Promise<Session | undefined> => {
        return sessionStore.get(id);
    },
    deleteSession: async (id: string): Promise<boolean> => {
        return sessionStore.delete(id);
    },
    deleteSessions: async (ids: string[]): Promise<boolean> => {
        ids.forEach(id => sessionStore.delete(id));
        return true;
    },
    findSessionsByShop: async (shop: string): Promise<Session[]> => {
        const sessions: Session[] = [];
        sessionStore.forEach((session) => {
            if (session.shop === shop) {
                sessions.push(session);
            }
        });
        return sessions;
    },
};

export { ApiVersion };
