/**
 * Active Users Tracker
 * Keeps track of active users on websites
 */
import { createCache } from './cache';
// Session timeout in milliseconds (5 minutes)
const SESSION_TIMEOUT = 5 * 60 * 1000;
class ActiveUsersTracker {
    constructor() {
        // Create a cache with session timeout
        this.sessions = createCache(SESSION_TIMEOUT);
        this.websiteSessions = new Map();
        // Clean up expired sessions every minute
        setInterval(() => this.cleanupExpiredSessions(), 60 * 1000);
    }
    /**
     * Track a user session
     */
    trackSession(session) {
        var _a;
        const sessionId = session.id;
        const lastActive = Date.now();
        // Store the session
        this.sessions.set(sessionId, Object.assign(Object.assign({}, session), { lastActive }));
        // Add to website sessions
        if (!this.websiteSessions.has(session.websiteId)) {
            this.websiteSessions.set(session.websiteId, new Set());
        }
        (_a = this.websiteSessions.get(session.websiteId)) === null || _a === void 0 ? void 0 : _a.add(sessionId);
        return sessionId;
    }
    /**
     * Update a session's last active time
     */
    updateSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return false;
        }
        // Update last active time
        this.sessions.set(sessionId, Object.assign(Object.assign({}, session), { lastActive: Date.now() }));
        return true;
    }
    /**
     * Get active users count for a website
     */
    getActiveUsers(websiteId) {
        if (!this.websiteSessions.has(websiteId)) {
            return 0;
        }
        // Filter out expired sessions
        const now = Date.now();
        const activeSessions = Array.from(this.websiteSessions.get(websiteId) || [])
            .filter(sessionId => {
            const session = this.sessions.get(sessionId);
            return session && now - session.lastActive < SESSION_TIMEOUT;
        });
        return Math.max(1, activeSessions.length); // Always show at least 1 active user
    }
    /**
     * Get active sessions for a website
     */
    getActiveSessions(websiteId) {
        if (!this.websiteSessions.has(websiteId)) {
            return [];
        }
        // Get all sessions for the website
        const now = Date.now();
        const activeSessions = Array.from(this.websiteSessions.get(websiteId) || [])
            .map(sessionId => this.sessions.get(sessionId))
            .filter((session) => {
            return !!session && now - session.lastActive < SESSION_TIMEOUT;
        });
        return activeSessions;
    }
    /**
     * Clean up expired sessions
     */
    cleanupExpiredSessions() {
        const now = Date.now();
        // Check all website sessions
        for (const [websiteId, sessionIds] of this.websiteSessions.entries()) {
            // Filter out expired sessions
            const expiredSessionIds = Array.from(sessionIds).filter(sessionId => {
                const session = this.sessions.get(sessionId);
                return !session || now - session.lastActive >= SESSION_TIMEOUT;
            });
            // Remove expired sessions
            expiredSessionIds.forEach(sessionId => {
                sessionIds.delete(sessionId);
            });
            // Remove website entry if no sessions
            if (sessionIds.size === 0) {
                this.websiteSessions.delete(websiteId);
            }
        }
    }
}
// Export singleton instance
export const activeUsersTracker = new ActiveUsersTracker();
