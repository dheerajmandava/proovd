import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as createWebsite } from '../app/api/websites/route';
import { initializeDomainVerification } from '../app/lib/server-domain-verification';
import { connectToDatabase } from '../app/lib/db';
import { auth } from '@/auth';
import Website from '../app/lib/models/website';
import { generateApiKey } from '../app/lib/server-utils';
import { VerificationMethod } from '@/app/lib/domain-verification';
import { Session } from 'next-auth';

// Mock dependencies
vi.mock('@/auth', () => ({
  auth: vi.fn()
}));

vi.mock('../app/lib/db', () => ({
  connectToDatabase: vi.fn()
}));

vi.mock('../app/lib/models/website', () => ({
  default: {
    findOne: vi.fn(),
    prototype: {
      save: vi.fn()
    }
  }
}));

vi.mock('../app/lib/server-domain-verification', () => ({
  initializeDomainVerification: vi.fn()
}));

vi.mock('../app/lib/server-utils', () => ({
  sanitizeInput: vi.fn(input => input),
  extractDomain: vi.fn(domain => domain),
  generateApiKey: vi.fn(() => 'test-api-key-123')
}));

describe('Website Creation API', () => {
  let mockRequest: NextRequest;
  
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Mock authentication
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'test-user-id', name: 'Test User', email: 'test@example.com' },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    } as Session);
    
    // Mock database connection
    vi.mocked(connectToDatabase).mockResolvedValue();
    
    // Mock Website.findOne to return null (no existing website)
    vi.mocked(Website.findOne).mockResolvedValue(null);
    
    // Mock initializeDomainVerification
    vi.mocked(initializeDomainVerification).mockReturnValue({
      status: 'pending',
      method: VerificationMethod.DNS,
      token: 'test-token-123',
      attempts: 0
    });
    
    // Mock Website constructor and save method
    const mockWebsite = {
      _id: 'test-website-id',
      name: 'Test Website',
      domain: 'example.com',
      apiKey: 'test-api-key-123',
      status: 'pending',
      verification: {
        status: 'pending',
        method: VerificationMethod.DNS,
        token: 'test-token-123',
        attempts: 0
      },
      createdAt: new Date().toISOString(),
      save: vi.fn().mockResolvedValue(true)
    };
    
    // @ts-ignore - mock constructor
    Website.mockImplementation(() => mockWebsite);
    
    // Create mock request
    mockRequest = {
      json: vi.fn().mockResolvedValue({
        name: 'Test Website',
        domain: 'example.com',
        verificationMethod: VerificationMethod.DNS
      })
    } as unknown as NextRequest;
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  it('should create a website with valid data', async () => {
    const response = await createWebsite(mockRequest);
    const responseData = await response.json();
    
    // Assertions
    expect(response.status).toBe(201);
    expect(responseData.name).toBe('Test Website');
    expect(responseData.domain).toBe('example.com');
    expect(responseData.status).toBe('pending');
    
    // Verify API Key was generated
    expect(generateApiKey).toHaveBeenCalled();
  });
  
  it('should reject if user is not authenticated', async () => {
    // Mock auth to return no user
    vi.mocked(auth).mockResolvedValue({
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    } as Session);
    
    const response = await createWebsite(mockRequest);
    const responseData = await response.json();
    
    // Assertions
    expect(response.status).toBe(401);
    expect(responseData.error).toBe('Authentication required');
  });
  
  it('should reject if domain already exists for the user', async () => {
    // Mock Website.findOne to return an existing website
    vi.mocked(Website.findOne).mockResolvedValue({
      _id: 'existing-website-id',
      name: 'Existing Website',
      domain: 'example.com'
    });
    
    const response = await createWebsite(mockRequest);
    const responseData = await response.json();
    
    // Assertions
    expect(response.status).toBe(400);
    expect(responseData.error).toBe('You already have a website with this domain');
  });
  
  it('should handle domain from URL format', async () => {
    // Create mock request with URL as domain
    const urlMockRequest = {
      json: vi.fn().mockResolvedValue({
        name: 'Test Website',
        domain: 'https://example.com/some/path',
        verificationMethod: VerificationMethod.DNS
      })
    } as unknown as NextRequest;
    
    const response = await createWebsite(urlMockRequest);
    const responseData = await response.json();
    
    // Assertions
    expect(response.status).toBe(201);
    expect(responseData.domain).toBe('example.com');
  });
  
  it('should handle missing required fields', async () => {
    // Create mock request with missing fields
    const invalidMockRequest = {
      json: vi.fn().mockResolvedValue({
        name: 'Test Website'
        // Missing domain
      })
    } as unknown as NextRequest;
    
    const response = await createWebsite(invalidMockRequest);
    const responseData = await response.json();
    
    // Assertions
    expect(response.status).toBe(400);
    expect(responseData.error).toBe('Name and domain are required');
  });
}); 