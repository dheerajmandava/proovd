import dns from 'dns/promises';
import https from 'https';
import crypto from 'crypto';
import { VerificationMethod, VerificationStatus } from './domain-verification';
/**
 * Server-side domain extraction utility
 * @param domain Domain to normalize
 * @returns Normalized domain without protocol or www
 */
function extractDomain(domain) {
    if (!domain)
        return '';
    // Remove protocol
    let normalizedDomain = domain.trim().toLowerCase();
    if (normalizedDomain.startsWith('http://')) {
        normalizedDomain = normalizedDomain.substring(7);
    }
    else if (normalizedDomain.startsWith('https://')) {
        normalizedDomain = normalizedDomain.substring(8);
    }
    // Remove www. prefix if present
    if (normalizedDomain.startsWith('www.')) {
        normalizedDomain = normalizedDomain.substring(4);
    }
    // Remove trailing slash if present
    if (normalizedDomain.endsWith('/')) {
        normalizedDomain = normalizedDomain.slice(0, -1);
    }
    // Return only the domain part if there's a path
    const slashIndex = normalizedDomain.indexOf('/');
    if (slashIndex !== -1) {
        normalizedDomain = normalizedDomain.substring(0, slashIndex);
    }
    return normalizedDomain;
}
/**
 * Initialize domain verification - server-side version
 *
 * @param domain - Domain to verify
 * @returns Verification details
 */
export function initializeDomainVerification(domain) {
    // Generate a fixed-length, simple verification token (12 characters)
    // Makes it easier for users to add to DNS records
    const token = crypto.randomBytes(6).toString('hex');
    return {
        status: VerificationStatus.PENDING,
        method: VerificationMethod.DNS, // Only use DNS verification
        token,
        attempts: 0
    };
}
/**
 * Verify domain ownership (simplified to only use DNS)
 *
 * @param domain - Domain to verify
 * @param verification - Verification details with token
 * @returns Promise resolving to true if verified, false otherwise
 */
export async function verifyDomain(domain, verification) {
    const normalizedDomain = extractDomain(domain);
    const { token } = verification;
    try {
        return await verifyByDNS(normalizedDomain, token);
    }
    catch (error) {
        console.error(`Error verifying domain ${normalizedDomain}:`, error);
        return false;
    }
}
/**
 * Verify domain using DNS TXT records with multiple retries
 *
 * @param domain - Domain to verify
 * @param token - Verification token
 * @returns Promise resolving to verification success status
 */
async function verifyByDNS(domain, token) {
    // Maximum number of DNS lookup attempts
    const MAX_ATTEMPTS = 3;
    // Time to wait between attempts (ms)
    const RETRY_DELAY = 2000;
    console.log(`Starting DNS verification for domain: ${domain}`);
    console.log(`Looking for TXT record: _proovd.${domain} with token: ${token}`);
    // Handle test/development domains automatically
    if (process.env.NODE_ENV !== 'production' &&
        (domain === 'localhost' || domain === 'example.com' ||
            domain.endsWith('.test') || domain.endsWith('.local'))) {
        console.log(`Development mode: Automatically validating test domain ${domain}`);
        return true;
    }
    let lastError = null;
    // Try multiple DNS lookup attempts with delay between them
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
            console.log(`DNS verification attempt ${attempt}/${MAX_ATTEMPTS} for ${domain}`);
            // Check both with and without www prefix to be flexible
            const dnsResults = await Promise.allSettled([
                dns.resolveTxt(`_proovd.${domain}`),
                domain.includes('.') ? dns.resolveTxt(`_proovd.www.${domain}`) : Promise.reject('Invalid domain')
            ]);
            // Combine successful results
            const records = dnsResults
                .filter(result => result.status === 'fulfilled')
                .map(result => result.value)
                .flat();
            if (records.length === 0) {
                console.log(`No DNS TXT records found for _proovd.${domain}`);
                if (attempt < MAX_ATTEMPTS) {
                    console.log(`Waiting ${RETRY_DELAY}ms before next attempt...`);
                    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                }
                continue;
            }
            console.log(`Found DNS records:`, records);
            // Check for token match (case insensitive to be more forgiving)
            const isVerified = records.some(record => record.some(value => {
                console.log('value', value);
                console.log('token', token);
                return value.trim().toLowerCase() === token.toLowerCase();
            }));
            if (isVerified) {
                console.log(`DNS verification successful for ${domain}`);
                return true;
            }
            console.log(`DNS record found but token didn't match for ${domain}`);
            if (attempt < MAX_ATTEMPTS) {
                console.log(`Waiting ${RETRY_DELAY}ms before next attempt...`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            }
        }
        catch (error) {
            lastError = error;
            console.error(`DNS resolution error (attempt ${attempt}/${MAX_ATTEMPTS}) for ${domain}:`, error);
            if (attempt < MAX_ATTEMPTS) {
                console.log(`Waiting ${RETRY_DELAY}ms before next attempt...`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            }
        }
    }
    // All attempts failed
    console.log(`All ${MAX_ATTEMPTS} DNS verification attempts failed for ${domain}`);
    return false;
}
/**
 * Verify domain using file method
 *
 * @param domain - Domain to verify
 * @param token - Verification token
 * @returns Promise resolving to verification success status
 */
async function verifyByFile(domain, token) {
    try {
        // Construct the URL to the verification file
        const url = `https://${domain}/.well-known/proovd-verification.txt`;
        return new Promise((resolve) => {
            https.get(url, (res) => {
                if (res.statusCode !== 200) {
                    console.error(`File verification failed with status ${res.statusCode} for ${domain}`);
                    resolve(false);
                    return;
                }
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    // Check if file content matches our token
                    const matched = data.trim() === token;
                    resolve(matched);
                });
            }).on('error', (err) => {
                console.error(`File verification request error for ${domain}:`, err);
                resolve(false);
            });
        });
    }
    catch (error) {
        console.error(`Error verifying file for ${domain}:`, error);
        return false;
    }
}
/**
 * Verify domain using meta tag
 *
 * @param domain - Domain to verify
 * @param token - Verification token
 * @returns Promise resolving to verification success status
 */
async function verifyByMeta(domain, token) {
    const url = `https://${domain}`;
    return new Promise((resolve) => {
        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                console.error(`Meta verification failed with status ${res.statusCode} for ${domain}`);
                resolve(false);
                return;
            }
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                // Check if HTML contains the meta tag with our token
                const metaTagRegex = new RegExp(`<meta[^>]*name=["']proovd-verification["'][^>]*content=["']${token}["'][^>]*>|` +
                    `<meta[^>]*content=["']${token}["'][^>]*name=["']proovd-verification["'][^>]*>`, 'i');
                const matched = metaTagRegex.test(data);
                resolve(matched);
            });
        }).on('error', (err) => {
            console.error(`Meta verification request error for ${domain}:`, err);
            resolve(false);
        });
    });
}
/**
 * Enhanced verification function with detailed results
 *
 * @param domain - Domain to verify
 * @param verification - Verification details with token
 * @returns Promise resolving to a verification result object
 */
export async function verifyDomainWithDetails(domain, verification) {
    const normalizedDomain = extractDomain(domain);
    const { token } = verification;
    try {
        // Log verification attempt for debugging
        console.log(`Verifying domain ${normalizedDomain} using DNS`);
        // Always use DNS verification method
        const isVerified = await verifyByDNS(normalizedDomain, token);
        return {
            isVerified,
            method: VerificationMethod.DNS,
            reason: isVerified ? undefined :
                `DNS verification failed. Please check that you've added the TXT record _proovd.${normalizedDomain} with value ${token}. DNS changes may take up to 24 hours to propagate.`
        };
    }
    catch (error) {
        console.error(`Error verifying domain ${normalizedDomain}:`, error);
        return {
            isVerified: false,
            method: VerificationMethod.DNS,
            reason: `Verification error: ${error.message}. Please try again in a few minutes.`
        };
    }
}
