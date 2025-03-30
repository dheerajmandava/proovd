/**
 * Bot detection utility functions
 * Used to detect and filter bot traffic from metrics
 */
/**
 * Common bot user agent patterns
 */
const BOT_USER_AGENT_PATTERNS = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /pingdom/i,
    /lighthouse/i,
    /slurp/i,
    /yahoo/i,
    /yandex/i,
    /baidu/i,
    /bingbot/i,
    /googlebot/i,
    /baiduspider/i,
    /facebookexternalhit/i,
    /twitterbot/i,
    /rogerbot/i,
    /linkedinbot/i,
    /embedly/i,
    /quora link preview/i,
    /showyoubot/i,
    /outbrain/i,
    /pinterest/i,
    /vkshare/i,
    /w3c_validator/i,
    /favicon/i,
    /facebook/i,
    /semrush/i,
    /ahrefsbot/i,
    /pingdom/i,
    /uptimerobot/i,
    /statuscake/i,
    /chrome-lighthouse/i,
    /headless/i
];
/**
 * Common crawler IP patterns and ranges
 * Note: This is a basic list and should be expanded based on specific needs
 */
const KNOWN_BOT_IPS = [
    '66.249.64.', // Google
    '66.249.66.',
    '66.249.90.',
    '157.55.39.', // Bing
    '40.77.167.',
    '17.58.98.', // Apple
    '17.58.99.',
    '199.16.156.', // Twitter
    '199.59.148.',
    '199.59.149.',
    '199.59.150.',
    '208.115.111.', // Alexa
    '208.115.112.',
    '204.62.14.', // Baidu
    '180.76.15.',
];
/**
 * Analyze the user agent string to detect if it's a bot
 *
 * @param userAgent The user agent string from the request
 * @returns boolean True if detected as a bot
 */
export function isBotUserAgent(userAgent) {
    if (!userAgent)
        return false;
    // Check against known bot patterns
    return BOT_USER_AGENT_PATTERNS.some(pattern => pattern.test(userAgent));
}
/**
 * Check if the IP address belongs to a known bot
 *
 * @param ip The IP address from the request
 * @returns boolean True if detected as a bot
 */
export function isBotIp(ip) {
    if (!ip)
        return false;
    // Check against known bot IPs
    return KNOWN_BOT_IPS.some(botIp => ip.startsWith(botIp));
}
/**
 * Check for common bot behavior patterns
 *
 * @param request Request data for behavioral analysis
 * @returns boolean True if behavior suggests a bot
 */
export function hasBotBehavior(data) {
    // If the request has no referrer and is not the first page load
    const hasNoReferrer = !data.referrer && data.requestInterval !== undefined;
    // Very fast repeated requests are often bots
    const hasAbnormalRequestPattern = data.requestInterval !== undefined && data.requestInterval < 200;
    return hasNoReferrer || hasAbnormalRequestPattern;
}
/**
 * Main bot detection function that combines all detection methods
 *
 * @param data Request data for bot detection
 * @returns boolean True if the request is likely from a bot
 */
export function isBot(data) {
    // Check user agent
    if (isBotUserAgent(data.userAgent)) {
        return true;
    }
    // Check IP address
    if (isBotIp(data.ip)) {
        return true;
    }
    // Check behavior patterns
    if (hasBotBehavior(data)) {
        return true;
    }
    return false;
}
