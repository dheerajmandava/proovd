/**
 * WebSocket Server for ProovdPulse
 * Handles real-time user engagement tracking
 */
import { WebSocketServer } from 'ws';
import { ipLocationService } from './services/ip-location.service';
import { parse } from 'url';
/**
 * ProovdPulse WebSocket Server
 * Handles real-time communication between the ProovdPulse widget and the server
 */
export class PulseWebSocketServer {
    constructor() {
        this.wss = null;
        this.clients = new Map();
        this.websiteStats = new Map();
        this.ownerConnections = new Map();
        this.httpServer = null;
        this.isStarted = false;
    }
    /**
     * Initialize the WebSocket server
     * @param server HTTP server to attach to
     */
    init(server) {
        if (this.isStarted) {
            console.log('WebSocket server already started');
            return;
        }
        try {
            this.httpServer = server;
            // Initialize WebSocket Server
            this.wss = new WebSocketServer({
                server,
                path: '/ws/pulse',
            });
            console.log('WebSocket server initialized');
            // Handle connections
            this.wss.on('connection', this.handleConnection.bind(this));
            // Setup cleanup interval (every 60 seconds)
            this.cleanupInterval = setInterval(this.cleanupInactiveClients.bind(this), 60000);
            // Setup broadcast interval (every 10 seconds)
            this.broadcastInterval = setInterval(this.broadcastStats.bind(this), 10000);
            this.isStarted = true;
        }
        catch (error) {
            console.error('Failed to initialize WebSocket server:', error);
        }
    }
    /**
     * Handle connection from a client
     * @param ws WebSocket connection
     * @param request HTTP request
     */
    handleConnection(ws, request) {
        var _a, _b;
        try {
            // Parse URL for query parameters
            const { query } = parse(request.url || '', true);
            const clientId = query.clientId;
            const websiteId = query.websiteId;
            const isOwner = query.isOwner === 'true';
            if (!clientId || !websiteId) {
                console.log('Missing clientId or websiteId, closing connection');
                ws.close(1008, 'Missing required parameters');
                return;
            }
            if (isOwner) {
                // This is a dashboard connection
                if (!this.ownerConnections.has(websiteId)) {
                    this.ownerConnections.set(websiteId, new Set());
                }
                (_a = this.ownerConnections.get(websiteId)) === null || _a === void 0 ? void 0 : _a.add(ws);
                ws.on('close', () => {
                    var _a, _b;
                    (_a = this.ownerConnections.get(websiteId)) === null || _a === void 0 ? void 0 : _a.delete(ws);
                    if (((_b = this.ownerConnections.get(websiteId)) === null || _b === void 0 ? void 0 : _b.size) === 0) {
                        this.ownerConnections.delete(websiteId);
                    }
                });
                // Send initial stats
                const stats = this.websiteStats.get(websiteId);
                if (stats) {
                    this.sendStatsToDashboard(websiteId, stats);
                }
                return;
            }
            // Extract client information
            const ipAddress = ((_b = request.headers['x-forwarded-for']) === null || _b === void 0 ? void 0 : _b.split(',')[0].trim()) ||
                request.socket.remoteAddress || '';
            const userAgent = request.headers['user-agent'] || '';
            // Create client connection
            const client = {
                id: clientId,
                websiteId,
                ws,
                ipAddress,
                userAgent,
                lastActive: Date.now(),
                metrics: {
                    scrollPercentage: 0,
                    timeOnPage: 0,
                    clickCount: 0,
                    focusedElements: []
                }
            };
            // Save client
            this.clients.set(clientId, client);
            // Log connection
            console.log(`Client ${clientId} connected to website ${websiteId} from ${ipAddress}`);
            // Fetch location data for client
            this.enrichClientWithLocation(client);
            // Initialize website stats if not exists
            if (!this.websiteStats.has(websiteId)) {
                this.websiteStats.set(websiteId, {
                    websiteId,
                    activeUsers: 0,
                    usersByCountry: {},
                    usersByCity: {},
                    avgTimeOnPage: 0,
                    avgScrollPercentage: 0,
                    totalClicks: 0
                });
            }
            // Update stats for this website
            this.updateWebsiteStats(websiteId);
            // Setup message handler
            ws.on('message', (message) => {
                this.handleMessage(clientId, message);
            });
            // Setup close handler
            ws.on('close', () => {
                console.log(`Client ${clientId} disconnected`);
                this.clients.delete(clientId);
                this.updateWebsiteStats(websiteId);
            });
            // Setup error handler
            ws.on('error', (error) => {
                console.error(`Error with client ${clientId}:`, error);
                this.clients.delete(clientId);
                this.updateWebsiteStats(websiteId);
            });
            // Send initial stats to the client
            this.sendStatsToClient(client);
        }
        catch (error) {
            console.error('Error handling connection:', error);
            ws.close(1011, 'Internal server error');
        }
    }
    /**
     * Handle message from a client
     * @param clientId Client ID
     * @param message Message data
     */
    handleMessage(clientId, message) {
        try {
            const client = this.clients.get(clientId);
            if (!client) {
                console.log(`Received message from unknown client ${clientId}`);
                return;
            }
            // Update last activity
            client.lastActive = Date.now();
            // Parse message
            const data = JSON.parse(message.toString());
            // Process based on message type
            switch (data.type) {
                case 'heartbeat':
                    // Just update last activity
                    break;
                case 'metrics':
                    // Update client metrics
                    if (data.metrics) {
                        client.metrics = Object.assign(Object.assign({}, client.metrics), data.metrics);
                    }
                    this.updateWebsiteStats(client.websiteId);
                    break;
                case 'event':
                    // Process click events
                    if (data.eventType === 'click') {
                        client.metrics.clickCount = (client.metrics.clickCount || 0) + 1;
                        this.updateWebsiteStats(client.websiteId);
                    }
                    break;
                default:
                    // Handle initial connection data
                    if (data.url) {
                        client.url = data.url;
                    }
                    if (data.referrer) {
                        client.referrer = data.referrer;
                    }
                    if (data.metrics) {
                        client.metrics = Object.assign(Object.assign({}, client.metrics), data.metrics);
                    }
                    this.updateWebsiteStats(client.websiteId);
                    break;
            }
        }
        catch (error) {
            console.error(`Error handling message from ${clientId}:`, error);
        }
    }
    /**
     * Enrich client with location data
     * @param client Client connection
     */
    async enrichClientWithLocation(client) {
        try {
            if (!client.ipAddress || client.ipAddress === '::1' || client.ipAddress === '127.0.0.1') {
                // Skip localhost - assign random country for testing
                client.location = {
                    country: ['US', 'GB', 'CA', 'IN', 'AU'][Math.floor(Math.random() * 5)],
                    city: ['New York', 'London', 'Toronto', 'Mumbai', 'Sydney'][Math.floor(Math.random() * 5)],
                    region: ['NY', 'England', 'Ontario', 'Maharashtra', 'NSW'][Math.floor(Math.random() * 5)]
                };
                return;
            }
            const locationData = await ipLocationService.getLocationData(client.ipAddress);
            if (locationData) {
                client.location = {
                    country: locationData.country_code,
                    city: locationData.city,
                    // Now using the region_name property which is defined in the LocationData interface
                    region: locationData.region_name || locationData.country
                };
            }
        }
        catch (error) {
            console.error(`Error enriching client ${client.id} with location:`, error);
        }
    }
    /**
     * Send statistics to a specific client
     * @param client Client connection
     */
    sendStatsToClient(client) {
        try {
            const stats = this.websiteStats.get(client.websiteId);
            if (stats && client.ws.readyState === 1) {
                client.ws.send(JSON.stringify({
                    type: 'stats',
                    activeUsers: stats.activeUsers
                }));
            }
        }
        catch (error) {
            console.error(`Error sending stats to client ${client.id}:`, error);
        }
    }
    /**
     * Send statistics to dashboard
     * @param websiteId Website ID
     * @param stats Website statistics
     */
    sendStatsToDashboard(websiteId, stats) {
        try {
            const owners = this.ownerConnections.get(websiteId);
            if (!owners || owners.size === 0) {
                return;
            }
            // Convert country and city data to a format suitable for the dashboard
            const locations = Object.entries(stats.usersByCountry).map(([country, count]) => ({
                country,
                count
            }));
            const message = JSON.stringify({
                type: 'dashboardStats',
                activeUsers: stats.activeUsers,
                avgTimeOnPage: stats.avgTimeOnPage,
                avgScrollPercentage: stats.avgScrollPercentage,
                totalClicks: stats.totalClicks,
                locations,
                cities: Object.entries(stats.usersByCity).map(([city, count]) => ({
                    city,
                    count
                }))
            });
            for (const owner of owners) {
                if (owner.readyState === 1) {
                    owner.send(message);
                }
            }
        }
        catch (error) {
            console.error(`Error sending stats to dashboard for website ${websiteId}:`, error);
        }
    }
    /**
     * Update statistics for a website
     * @param websiteId Website ID
     */
    updateWebsiteStats(websiteId) {
        var _a, _b;
        try {
            // Get all clients for this website
            const activeClients = Array.from(this.clients.values())
                .filter(client => client.websiteId === websiteId);
            const stats = this.websiteStats.get(websiteId) || {
                websiteId,
                activeUsers: 0,
                usersByCountry: {},
                usersByCity: {},
                avgTimeOnPage: 0,
                avgScrollPercentage: 0,
                totalClicks: 0
            };
            // Update active users (always show at least 1)
            stats.activeUsers = Math.max(1, activeClients.length);
            // Calculate average time on page
            if (activeClients.length > 0) {
                const totalTimeOnPage = activeClients.reduce((sum, client) => { var _a; return sum + (((_a = client.metrics) === null || _a === void 0 ? void 0 : _a.timeOnPage) || 0); }, 0);
                stats.avgTimeOnPage = Math.round(totalTimeOnPage / activeClients.length);
            }
            // Update locations
            stats.usersByCountry = {};
            stats.usersByCity = {};
            for (const client of activeClients) {
                if ((_a = client.location) === null || _a === void 0 ? void 0 : _a.country) {
                    stats.usersByCountry[client.location.country] = (stats.usersByCountry[client.location.country] || 0) + 1;
                }
                if ((_b = client.location) === null || _b === void 0 ? void 0 : _b.city) {
                    stats.usersByCity[client.location.city] = (stats.usersByCity[client.location.city] || 0) + 1;
                }
            }
            // Calculate average scroll percentage
            const totalScrollPercentage = activeClients.reduce((sum, client) => { var _a; return sum + (((_a = client.metrics) === null || _a === void 0 ? void 0 : _a.scrollPercentage) || 0); }, 0);
            stats.avgScrollPercentage = activeClients.length > 0
                ? Math.round(totalScrollPercentage / activeClients.length)
                : 0;
            // Calculate total clicks
            stats.totalClicks = activeClients.reduce((sum, client) => { var _a; return sum + (((_a = client.metrics) === null || _a === void 0 ? void 0 : _a.clickCount) || 0); }, 0);
            // Save updated stats
            this.websiteStats.set(websiteId, stats);
            // Send stats to clients
            this.sendStatsToDashboard(websiteId, stats);
        }
        catch (error) {
            console.error(`Error updating stats for website ${websiteId}:`, error);
        }
    }
    /**
     * Clean up inactive clients
     */
    cleanupInactiveClients() {
        try {
            const now = Date.now();
            const inactiveTimeout = 5 * 60 * 1000; // 5 minutes
            const websitesToUpdate = new Set();
            for (const [clientId, client] of this.clients.entries()) {
                if (now - client.lastActive > inactiveTimeout) {
                    console.log(`Cleaning up inactive client ${clientId}`);
                    // Close socket
                    if (client.ws.readyState === 1) {
                        client.ws.close(1000, 'Inactive timeout');
                    }
                    // Remove client
                    this.clients.delete(clientId);
                    // Mark website for update
                    websitesToUpdate.add(client.websiteId);
                }
            }
            // Update stats for affected websites
            for (const websiteId of websitesToUpdate) {
                this.updateWebsiteStats(websiteId);
            }
        }
        catch (error) {
            console.error('Error cleaning up inactive clients:', error);
        }
    }
    /**
     * Broadcast statistics to all clients
     */
    broadcastStats() {
        try {
            // Group clients by website
            const websiteClients = {};
            for (const client of this.clients.values()) {
                if (!websiteClients[client.websiteId]) {
                    websiteClients[client.websiteId] = [];
                }
                websiteClients[client.websiteId].push(client);
            }
            // Broadcast to each website's clients
            for (const [websiteId, clients] of Object.entries(websiteClients)) {
                const stats = this.websiteStats.get(websiteId);
                if (stats) {
                    for (const client of clients) {
                        if (client.ws.readyState === 1) {
                            client.ws.send(JSON.stringify({
                                type: 'stats',
                                activeUsers: stats.activeUsers
                            }));
                        }
                    }
                }
            }
        }
        catch (error) {
            console.error('Error broadcasting stats:', error);
        }
    }
    /**
     * Get active users count for a website
     * @param websiteId Website ID
     * @returns Active users count
     */
    getActiveUsersCount(websiteId) {
        const stats = this.websiteStats.get(websiteId);
        return (stats === null || stats === void 0 ? void 0 : stats.activeUsers) || 0;
    }
    /**
     * Get statistics for a website
     * @param websiteId Website ID
     * @returns Website statistics
     */
    getStats(websiteId) {
        return this.websiteStats.get(websiteId) || null;
    }
    /**
     * Shutdown the WebSocket server
     */
    shutdown() {
        try {
            console.log('Shutting down WebSocket server...');
            // Close all client connections
            for (const client of this.clients.values()) {
                if (client.ws.readyState === 1) {
                    client.ws.close(1000, 'Server shutdown');
                }
            }
            // Close all owner connections
            for (const owners of this.ownerConnections.values()) {
                for (const owner of owners) {
                    if (owner.readyState === 1) {
                        owner.close(1000, 'Server shutdown');
                    }
                }
            }
            // Close server
            if (this.wss) {
                this.wss.close();
                this.wss = null;
            }
            this.httpServer = null;
            // Clear intervals
            if (this.cleanupInterval) {
                clearInterval(this.cleanupInterval);
            }
            if (this.broadcastInterval) {
                clearInterval(this.broadcastInterval);
            }
            this.isStarted = false;
            console.log('WebSocket server shutdown complete');
        }
        catch (error) {
            console.error('Error shutting down WebSocket server:', error);
        }
    }
}
// Create singleton instance
export const pulseWebSocketServer = new PulseWebSocketServer();
