"use strict";
/**
 * IP Location Service
 * Uses iplocate.io to get geographic data for IP addresses
 */
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
exports.ipLocationService = void 0;
var cache_1 = require("@/app/lib/cache");
var IPLocationService = /** @class */ (function () {
    function IPLocationService() {
        var _this = this;
        this.API_KEY = 'aasasas123FVC12231'; // Use the API key provided
        this.API_URL = 'https://www.iplocate.io/api/lookup';
        this.requestCount = 0;
        this.dailyQuota = 1000; // Default daily quota
        // Create a cache with 24-hour TTL
        this.cache = (0, cache_1.createCache)(24 * 60 * 60 * 1000);
        // Reset request count daily
        setInterval(function () {
            _this.requestCount = 0;
        }, 24 * 60 * 60 * 1000);
    }
    /**
     * Get location data for an IP address
     */
    IPLocationService.prototype.getLocationData = function (ip) {
        return __awaiter(this, void 0, void 0, function () {
            var url, response, data, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Check quota
                        if (this.requestCount >= this.dailyQuota) {
                            console.warn('IP location API daily quota exceeded');
                            return [2 /*return*/, null];
                        }
                        // Check cache first
                        if (this.cache.has(ip)) {
                            return [2 /*return*/, this.cache.get(ip) || null];
                        }
                        // For local development, return mock data
                        if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
                            return [2 /*return*/, this.getMockLocationData()];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        url = "".concat(this.API_URL, "/").concat(ip);
                        return [4 /*yield*/, fetch(url)];
                    case 2:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Failed to get location data: ".concat(response.status, " ").concat(response.statusText));
                        }
                        return [4 /*yield*/, response.json()];
                    case 3:
                        data = _a.sent();
                        // Increment request count
                        this.requestCount++;
                        // Cache result
                        this.cache.set(ip, data);
                        return [2 /*return*/, data];
                    case 4:
                        error_1 = _a.sent();
                        console.error('Error getting location data:', error_1);
                        return [2 /*return*/, this.getMockLocationData()]; // Fallback to mock data on error
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get mock location data for development
     */
    IPLocationService.prototype.getMockLocationData = function () {
        var mockLocations = [
            { country: 'United States', country_code: 'US', city: 'New York', region_name: 'New York' },
            { country: 'United Kingdom', country_code: 'GB', city: 'London', region_name: 'England' },
            { country: 'Canada', country_code: 'CA', city: 'Toronto', region_name: 'Ontario' },
            { country: 'India', country_code: 'IN', city: 'Mumbai', region_name: 'Maharashtra' },
            { country: 'Australia', country_code: 'AU', city: 'Sydney', region_name: 'New South Wales' }
        ];
        var mock = mockLocations[Math.floor(Math.random() * mockLocations.length)];
        return {
            ip: '127.0.0.1',
            country: mock.country,
            country_code: mock.country_code,
            city: mock.city,
            continent: 'Unknown',
            latitude: 0,
            longitude: 0,
            time_zone: 'UTC',
            postal_code: '00000',
            org: 'Local',
            asn: 'Local',
            region_name: mock.region_name
        };
    };
    /**
     * Get current quota usage
     */
    IPLocationService.prototype.getQuotaUsage = function () {
        return {
            current: this.requestCount,
            limit: this.dailyQuota,
            percentage: Math.round((this.requestCount / this.dailyQuota) * 100)
        };
    };
    return IPLocationService;
}());
// Export a singleton instance
exports.ipLocationService = new IPLocationService();
