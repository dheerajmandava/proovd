/**
 * Active Users Tracker
 * Keeps track of active users on websites
 */

import { createCache } from './cache';

// Session timeout in milliseconds (5 minutes)
const SESSION_TIMEOUT = 5 * 60 * 1000;

// Types
interface UserSession {
  id: string;
  websiteId: string;
  url: string;
  referrer?: string;
  ipAddress: string;
  userAgent?: string;
  location?: {
    country?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
  lastActive: number;
}

class ActiveUsersTracker {
  private sessions: Map<string, UserSession>;
  private websiteSessions: Map<string, Set<string>>;
  
  constructor() {
    // Create a cache with session timeout
    this.sessions = createCache<UserSession>(SESSION_TIMEOUT);
    this.websiteSessions = new Map();
    
    // Clean up expired sessions every minute
    setInterval(() => this.cleanupExpiredSessions(), 60 * 1000);
  }
  
  /**
   * Track a user session
   */
  trackSession(session: Omit<UserSession, 'lastActive'>): string {
    const sessionId = session.id;
    const lastActive = Date.now();
    
    // Store the session
    this.sessions.set(sessionId, {
      ...session,
      lastActive
    });
    
    // Add to website sessions
    if (!this.websiteSessions.has(session.websiteId)) {
      this.websiteSessions.set(session.websiteId, new Set());
    }
    
    this.websiteSessions.get(session.websiteId)?.add(sessionId);
    
    return sessionId;
  }
  
  /**
   * Update a session's last active time
   */
  updateSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return false;
    }
    
    // Update last active time
    this.sessions.set(sessionId, {
      ...session,
      lastActive: Date.now()
    });
    
    return true;
  }
  
  /**
   * Get active users count for a website
   */
  getActiveUsers(websiteId: string): number {
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
  getActiveSessions(websiteId: string): UserSession[] {
    if (!this.websiteSessions.has(websiteId)) {
      return [];
    }
    
    // Get all sessions for the website
    const now = Date.now();
    const activeSessions = Array.from(this.websiteSessions.get(websiteId) || [])
      .map(sessionId => this.sessions.get(sessionId))
      .filter((session): session is UserSession => {
        return !!session && now - session.lastActive < SESSION_TIMEOUT;
      });
    
    return activeSessions;
  }
  
  /**
   * Clean up expired sessions
   */
  private cleanupExpiredSessions(): void {
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