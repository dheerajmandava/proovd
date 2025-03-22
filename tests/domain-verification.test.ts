import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateDomain } from '../app/api/domains/validate/helpers';
import { initializeDomainVerification } from '../app/lib/server-domain-verification';
import { verifyDomain } from '../app/lib/server-domain-verification';
import { VerificationMethod } from '../app/lib/domain-verification';

// Mock DNS and HTTP modules
vi.mock('dns/promises', () => ({
  default: {
    resolve: vi.fn(),
    resolveTxt: vi.fn()
  }
}));

vi.mock('https', () => ({
  get: vi.fn()
}));

import dns from 'dns/promises';
import https from 'https';

describe('Domain Verification System', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Domain Validation', () => {
    it('should validate a domain with proper format', async () => {
      // Mock DNS resolution to succeed
      vi.mocked(dns.resolve).mockResolvedValueOnce(['123.123.123.123']);
      
      // Create a mock for https.get that simulates a successful response
      const mockResponse = {
        statusCode: 200,
        on: vi.fn().mockImplementation(function(event, callback) {
          if (event === 'data') return this;
          if (event === 'end') {
            callback();
            return this;
          }
          return this;
        })
      };
      
      vi.mocked(https.get).mockImplementation((url, callback) => {
        if (typeof callback === 'function') {
          callback(mockResponse);
        }
        return {
          on: vi.fn().mockImplementation((event, callback) => {
            return {};
          })
        };
      });
      
      const result = await validateDomain('example.com');
      
      expect(result.valid).toBe(true);
      expect(result.domain).toBe('example.com');
      expect(result.dnsRecords).toBe(true);
    });

    it('should fail validation for invalid domain format', async () => {
      const result = await validateDomain('invalid-domain');
      
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle DNS resolution failure', async () => {
      // Mock DNS resolution to fail
      vi.mocked(dns.resolve).mockRejectedValueOnce(new Error('DNS resolution failed'));
      vi.mocked(dns.resolveTxt).mockRejectedValueOnce(new Error('DNS TXT resolution failed'));
      
      const result = await validateDomain('nonexistent-domain.com');
      
      expect(result.valid).toBe(false);
      expect(result.dnsRecords).toBe(false);
    });
  });

  describe('Domain Verification Initialization', () => {
    it('should correctly initialize domain verification', () => {
      const domain = 'example.com';
      const method = VerificationMethod.DNS;
      
      const verification = initializeDomainVerification(domain, method);
      
      expect(verification.status).toBe('pending');
      expect(verification.method).toBe(method);
      expect(verification.token).toBeDefined();
      expect(verification.attempts).toBe(0);
    });

    it('should use DNS as default verification method', () => {
      const domain = 'example.com';
      
      const verification = initializeDomainVerification(domain);
      
      expect(verification.method).toBe(VerificationMethod.DNS);
    });
  });

  describe('Domain Verification Process', () => {
    it('should verify a domain using DNS method', async () => {
      // Create verification details for testing
      const verification = {
        status: 'pending',
        method: VerificationMethod.DNS,
        token: 'test-token-123',
        attempts: 0
      };
      
      // Mock DNS TXT resolution to return our token
      vi.mocked(dns.resolveTxt).mockResolvedValueOnce([['test-token-123']]);
      
      const result = await verifyDomain('example.com', verification);
      
      expect(result).toBe(true);
      expect(dns.resolveTxt).toHaveBeenCalledWith('_proovd.example.com');
    });

    it('should verify a domain using FILE method', async () => {
      // Create verification details for testing
      const verification = {
        status: 'pending',
        method: VerificationMethod.FILE,
        token: 'test-token-123',
        attempts: 0
      };
      
      // Create a mock for https.get that simulates a successful response
      const mockResponse = {
        statusCode: 200,
        on: vi.fn().mockImplementation(function(event, callback) {
          if (event === 'data') {
            callback('test-token-123');
            return this;
          }
          if (event === 'end') {
            callback();
            return this;
          }
          return this;
        })
      };
      
      vi.mocked(https.get).mockImplementation((url, callback) => {
        if (typeof callback === 'function') {
          callback(mockResponse);
        }
        return {
          on: vi.fn().mockImplementation((event, callback) => {
            return {};
          })
        };
      });
      
      const result = await verifyDomain('example.com', verification);
      
      expect(result).toBe(true);
    });

    it('should handle verification failure', async () => {
      // Create verification details for testing
      const verification = {
        status: 'pending',
        method: VerificationMethod.DNS,
        token: 'test-token-123',
        attempts: 0
      };
      
      // Mock DNS TXT resolution to return wrong token
      vi.mocked(dns.resolveTxt).mockResolvedValueOnce([['wrong-token-456']]);
      
      const result = await verifyDomain('example.com', verification);
      
      expect(result).toBe(false);
    });
  });
}); 