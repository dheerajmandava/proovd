"use strict";
/**
 * WebSocket Server for ProovdPulse
 * Handles real-time user engagement tracking
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pulseWebSocketServer = exports.PulseWebSocketServer = void 0;
var ws_1 = require("ws");
var ip_location_service_1 = require("./services/ip-location.service");
var url_1 = require("url");
/**
 * ProovdPulse WebSocket Server
 * Handles real-time communication between the ProovdPulse widget and the server
 */
var PulseWebSocketServer = /** @class */ (function () {
    function PulseWebSocketServer() {
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
    PulseWebSocketServer.prototype.init = function (server) {
        if (this.isStarted) {
            console.log('WebSocket server already started');
            return;
        }
        try {
            this.httpServer = server;
            // Initialize WebSocket Server
            this.wss = new ws_1.WebSocketServer({
                server: server,
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
    };
    /**
     * Handle connection from a client
     * @param ws WebSocket connection
     * @param request HTTP request
     */
    PulseWebSocketServer.prototype.handleConnection = function (ws, request) {
        var _this = this;
        var _a, _b;
        try {
            // Parse URL for query parameters
            var query = (0, url_1.parse)(request.url || '', true).query;
            var clientId_1 = query.clientId;
            var websiteId_1 = query.websiteId;
            var isOwner = query.isOwner === 'true';
            if (!clientId_1 || !websiteId_1) {
                console.log('Missing clientId or websiteId, closing connection');
                ws.close(1008, 'Missing required parameters');
                return;
            }
            if (isOwner) {
                // This is a dashboard connection
                if (!this.ownerConnections.has(websiteId_1)) {
                    this.ownerConnections.set(websiteId_1, new Set());
                }
                (_a = this.ownerConnections.get(websiteId_1)) === null || _a === void 0 ? void 0 : _a.add(ws);
                ws.on('close', function () {
                    var _a, _b;
                    (_a = _this.ownerConnections.get(websiteId_1)) === null || _a === void 0 ? void 0 : _a.delete(ws);
                    if (((_b = _this.ownerConnections.get(websiteId_1)) === null || _b === void 0 ? void 0 : _b.size) === 0) {
                        _this.ownerConnections.delete(websiteId_1);
                    }
                });
                // Send initial stats
                var stats = this.websiteStats.get(websiteId_1);
                if (stats) {
                    this.sendStatsToDashboard(websiteId_1, stats);
                }
                return;
            }
            // Extract client information
            var ipAddress = ((_b = request.headers['x-forwarded-for']) === null || _b === void 0 ? void 0 : _b.split(',')[0].trim()) ||
                request.socket.remoteAddress || '';
            var userAgent = request.headers['user-agent'] || '';
            // Create client connection
            var client = {
                id: clientId_1,
                websiteId: websiteId_1,
                ws: ws,
                ipAddress: ipAddress,
                userAgent: userAgent,
                lastActive: Date.now(),
                metrics: {
                    scrollPercentage: 0,
                    timeOnPage: 0,
                    clickCount: 0,
                    focusedElements: []
                }
            };
            // Save client
            this.clients.set(clientId_1, client);
            // Log connection
            console.log("Client ".concat(clientId_1, " connected to website ").concat(websiteId_1, " from ").concat(ipAddress));
            // Fetch location data for client
            this.enrichClientWithLocation(client);
            // Initialize website stats if not exists
            if (!this.websiteStats.has(websiteId_1)) {
                this.websiteStats.set(websiteId_1, {
                    websiteId: websiteId_1,
                    activeUsers: 0,
                    usersByCountry: {},
                    usersByCity: {},
                    avgTimeOnPage: 0,
                    avgScrollPercentage: 0,
                    totalClicks: 0
                });
            }
            // Update stats for this website
            this.updateWebsiteStats(websiteId_1);
            // Setup message handler
            ws.on('message', function (message) {
                _this.handleMessage(clientId_1, message);
            });
            // Setup close handler
            ws.on('close', function () {
                console.log("Client ".concat(clientId_1, " disconnected"));
                _this.clients.delete(clientId_1);
                _this.updateWebsiteStats(websiteId_1);
            });
            // Setup error handler
            ws.on('error', function (error) {
                console.error("Error with client ".concat(clientId_1, ":"), error);
                _this.clients.delete(clientId_1);
                _this.updateWebsiteStats(websiteId_1);
            });
            // Send initial stats to the client
            this.sendStatsToClient(client);
        }
        catch (error) {
            console.error('Error handling connection:', error);
            ws.close(1011, 'Internal server error');
        }
    };
    /**
     * Handle message from a client
     * @param clientId Client ID
     * @param message Message data
     */
    PulseWebSocketServer.prototype.handleMessage = function (clientId, message) {
        try {
            var client = this.clients.get(clientId);
            if (!client) {
                console.log("Received message from unknown client ".concat(clientId));
                return;
            }
            // Update last activity
            client.lastActive = Date.now();
            // Parse message
            var data = JSON.parse(message.toString());
            // Process based on message type
            switch (data.type) {
                case 'heartbeat':
                    // Just update last activity
                    break;
                case 'metrics':
                    // Update client metrics
                    if (data.metrics) {
                        client.metrics = __assign(__assign({}, client.metrics), data.metrics);
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
                        client.metrics = __assign(__assign({}, client.metrics), data.metrics);
                    }
                    this.updateWebsiteStats(client.websiteId);
                    break;
            }
        }
        catch (error) {
            console.error("Error handling message from ".concat(clientId, ":"), error);
        }
    };
    /**
     * Enrich client with location data
     * @param client Client connection
     */
    PulseWebSocketServer.prototype.enrichClientWithLocation = function (client) {
        return __awaiter(this, void 0, void 0, function () {
            var locationData, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        if (!client.ipAddress || client.ipAddress === '::1' || client.ipAddress === '127.0.0.1') {
                            // Skip localhost - assign random country for testing
                            client.location = {
                                country: ['US', 'GB', 'CA', 'IN', 'AU'][Math.floor(Math.random() * 5)],
                                city: ['New York', 'London', 'Toronto', 'Mumbai', 'Sydney'][Math.floor(Math.random() * 5)],
                                region: ['NY', 'England', 'Ontario', 'Maharashtra', 'NSW'][Math.floor(Math.random() * 5)]
                            };
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, ip_location_service_1.ipLocationService.getLocationData(client.ipAddress)];
                    case 1:
                        locationData = _a.sent();
                        if (locationData) {
                            client.location = {
                                country: locationData.country_code,
                                city: locationData.city,
                                // Now using the region_name property which is defined in the LocationData interface
                                region: locationData.region_name || locationData.country
                            };
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        console.error("Error enriching client ".concat(client.id, " with location:"), error_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Send statistics to a specific client
     * @param client Client connection
     */
    PulseWebSocketServer.prototype.sendStatsToClient = function (client) {
        try {
            var stats = this.websiteStats.get(client.websiteId);
            if (stats && client.ws.readyState === 1) {
                client.ws.send(JSON.stringify({
                    type: 'stats',
                    activeUsers: stats.activeUsers
                }));
            }
        }
        catch (error) {
            console.error("Error sending stats to client ".concat(client.id, ":"), error);
        }
    };
    /**
     * Send statistics to dashboard
     * @param websiteId Website ID
     * @param stats Website statistics
     */
    PulseWebSocketServer.prototype.sendStatsToDashboard = function (websiteId, stats) {
        try {
            var owners = this.ownerConnections.get(websiteId);
            if (!owners || owners.size === 0) {
                return;
            }
            // Convert country and city data to a format suitable for the dashboard
            var locations = Object.entries(stats.usersByCountry).map(function (_a) {
                var country = _a[0], count = _a[1];
                return ({
                    country: country,
                    count: count
                });
            });
            var message = JSON.stringify({
                type: 'dashboardStats',
                activeUsers: stats.activeUsers,
                avgTimeOnPage: stats.avgTimeOnPage,
                avgScrollPercentage: stats.avgScrollPercentage,
                totalClicks: stats.totalClicks,
                locations: locations,
                cities: Object.entries(stats.usersByCity).map(function (_a) {
                    var city = _a[0], count = _a[1];
                    return ({
                        city: city,
                        count: count
                    });
                })
            });
            for (var _i = 0, owners_1 = owners; _i < owners_1.length; _i++) {
                var owner = owners_1[_i];
                if (owner.readyState === 1) {
                    owner.send(message);
                }
            }
        }
        catch (error) {
            console.error("Error sending stats to dashboard for website ".concat(websiteId, ":"), error);
        }
    };
    /**
     * Update statistics for a website
     * @param websiteId Website ID
     */
    PulseWebSocketServer.prototype.updateWebsiteStats = function (websiteId) {
        var _a, _b;
        try {
            // Get all clients for this website
            var activeClients = Array.from(this.clients.values())
                .filter(function (client) { return client.websiteId === websiteId; });
            var stats = this.websiteStats.get(websiteId) || {
                websiteId: websiteId,
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
                var totalTimeOnPage = activeClients.reduce(function (sum, client) { var _a; return sum + (((_a = client.metrics) === null || _a === void 0 ? void 0 : _a.timeOnPage) || 0); }, 0);
                stats.avgTimeOnPage = Math.round(totalTimeOnPage / activeClients.length);
            }
            // Update locations
            stats.usersByCountry = {};
            stats.usersByCity = {};
            for (var _i = 0, activeClients_1 = activeClients; _i < activeClients_1.length; _i++) {
                var client = activeClients_1[_i];
                if ((_a = client.location) === null || _a === void 0 ? void 0 : _a.country) {
                    stats.usersByCountry[client.location.country] = (stats.usersByCountry[client.location.country] || 0) + 1;
                }
                if ((_b = client.location) === null || _b === void 0 ? void 0 : _b.city) {
                    stats.usersByCity[client.location.city] = (stats.usersByCity[client.location.city] || 0) + 1;
                }
            }
            // Calculate average scroll percentage
            var totalScrollPercentage = activeClients.reduce(function (sum, client) { var _a; return sum + (((_a = client.metrics) === null || _a === void 0 ? void 0 : _a.scrollPercentage) || 0); }, 0);
            stats.avgScrollPercentage = activeClients.length > 0
                ? Math.round(totalScrollPercentage / activeClients.length)
                : 0;
            // Calculate total clicks
            stats.totalClicks = activeClients.reduce(function (sum, client) { var _a; return sum + (((_a = client.metrics) === null || _a === void 0 ? void 0 : _a.clickCount) || 0); }, 0);
            // Save updated stats
            this.websiteStats.set(websiteId, stats);
            // Send stats to clients
            this.sendStatsToDashboard(websiteId, stats);
        }
        catch (error) {
            console.error("Error updating stats for website ".concat(websiteId, ":"), error);
        }
    };
    /**
     * Clean up inactive clients
     */
    PulseWebSocketServer.prototype.cleanupInactiveClients = function () {
        try {
            var now = Date.now();
            var inactiveTimeout = 5 * 60 * 1000; // 5 minutes
            var websitesToUpdate = new Set();
            for (var _i = 0, _a = this.clients.entries(); _i < _a.length; _i++) {
                var _b = _a[_i], clientId = _b[0], client = _b[1];
                if (now - client.lastActive > inactiveTimeout) {
                    console.log("Cleaning up inactive client ".concat(clientId));
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
            for (var _c = 0, websitesToUpdate_1 = websitesToUpdate; _c < websitesToUpdate_1.length; _c++) {
                var websiteId = websitesToUpdate_1[_c];
                this.updateWebsiteStats(websiteId);
            }
        }
        catch (error) {
            console.error('Error cleaning up inactive clients:', error);
        }
    };
    /**
     * Broadcast statistics to all clients
     */
    PulseWebSocketServer.prototype.broadcastStats = function () {
        try {
            // Group clients by website
            var websiteClients = {};
            for (var _i = 0, _a = this.clients.values(); _i < _a.length; _i++) {
                var client = _a[_i];
                if (!websiteClients[client.websiteId]) {
                    websiteClients[client.websiteId] = [];
                }
                websiteClients[client.websiteId].push(client);
            }
            // Broadcast to each website's clients
            for (var _b = 0, _c = Object.entries(websiteClients); _b < _c.length; _b++) {
                var _d = _c[_b], websiteId = _d[0], clients = _d[1];
                var stats = this.websiteStats.get(websiteId);
                if (stats) {
                    for (var _e = 0, clients_1 = clients; _e < clients_1.length; _e++) {
                        var client = clients_1[_e];
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
    };
    /**
     * Get active users count for a website
     * @param websiteId Website ID
     * @returns Active users count
     */
    PulseWebSocketServer.prototype.getActiveUsersCount = function (websiteId) {
        var stats = this.websiteStats.get(websiteId);
        return (stats === null || stats === void 0 ? void 0 : stats.activeUsers) || 0;
    };
    /**
     * Get statistics for a website
     * @param websiteId Website ID
     * @returns Website statistics
     */
    PulseWebSocketServer.prototype.getStats = function (websiteId) {
        return this.websiteStats.get(websiteId) || null;
    };
    /**
     * Shutdown the WebSocket server
     */
    PulseWebSocketServer.prototype.shutdown = function () {
        try {
            console.log('Shutting down WebSocket server...');
            // Close all client connections
            for (var _i = 0, _a = this.clients.values(); _i < _a.length; _i++) {
                var client = _a[_i];
                if (client.ws.readyState === 1) {
                    client.ws.close(1000, 'Server shutdown');
                }
            }
            // Close all owner connections
            for (var _b = 0, _c = this.ownerConnections.values(); _b < _c.length; _b++) {
                var owners = _c[_b];
                for (var _d = 0, owners_2 = owners; _d < owners_2.length; _d++) {
                    var owner = owners_2[_d];
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
    };
    return PulseWebSocketServer;
}());
exports.PulseWebSocketServer = PulseWebSocketServer;
// Create singleton instance
exports.pulseWebSocketServer = new PulseWebSocketServer();
