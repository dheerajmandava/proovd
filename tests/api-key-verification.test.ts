import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { POST } from '@/app/api/websites/[id]/api-keys/route';
import Website from '@/app/models/Website';
import { connectToDatabase } from '@/app/lib/db';

// Mock auth
vi.mock('@/auth', () => ({
  auth: vi.fn(() => Promise.resolve({ user: { id: 'test-user-id' } }))
}));

// Mock database connection
vi.mock('@/app/lib/db', () => ({
  connectToDatabase: vi.fn()
}));

// Mock Website model
vi.mock('@/app/models/Website', () => ({
  default: {
    findOne: vi.fn(),
  }
}));

describe('API Key Verification Tests', () => {
  const mockWebsiteId = 'mock-website-id';
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should reject API key creation when website is not verified', async () => {
    // Mock unverified website
    const mockUnverifiedWebsite = {
      _id: mockWebsiteId,
      userId: 'test-user-id',
      name: 'Test Website',
      domain: 'example.com',
      verification: {
        status: 'pending',
        method: 'dns',
        token: 'test-token',
        attempts: 0
      },
      status: 'pending',
      apiKeys: [],
      save: vi.fn().mockResolvedValue(true)
    };

    // Setup mocks
    (Website.findOne as any).mockResolvedValue(mockUnverifiedWebsite);

    // Create mock request
    const req = {
      json: vi.fn().mockResolvedValue({
        name: 'Test API Key',
        allowedOrigins: ['example.com']
      })
    } as unknown as NextRequest;

    // Call the API endpoint
    const response = await POST(req, { params: { id: mockWebsiteId } });
    const responseData = await response.json();

    // Assertions
    expect(response.status).toBe(403);
    expect(responseData.error).toContain('Website must be verified');
    expect(responseData.verificationRequired).toBe(true);
    expect(mockUnverifiedWebsite.save).not.toHaveBeenCalled();
  });

  it('should allow API key creation when website is verified', async () => {
    // Mock verified website
    const mockVerifiedWebsite = {
      _id: mockWebsiteId,
      userId: 'test-user-id',
      name: 'Test Website',
      domain: 'example.com',
      verification: {
        status: 'verified',
        method: 'dns',
        token: 'test-token',
        attempts: 1,
        verifiedAt: new Date().toISOString()
      },
      status: 'verified',
      apiKeys: [],
      save: vi.fn().mockResolvedValue(true)
    };

    // Setup mocks
    (Website.findOne as any).mockResolvedValue(mockVerifiedWebsite);

    // Create mock request
    const req = {
      json: vi.fn().mockResolvedValue({
        name: 'Test API Key',
        allowedOrigins: ['example.com']
      })
    } as unknown as NextRequest;

    // Call the API endpoint
    const response = await POST(req, { params: { id: mockWebsiteId } });
    
    // Assertions
    expect(response.status).toBe(201);
    expect(mockVerifiedWebsite.save).toHaveBeenCalled();
    
    // Verify API key was added to the website
    const savedWebsite = mockVerifiedWebsite.save.mock.calls[0][0];
    expect(savedWebsite.apiKeys.length).toBe(1);
    expect(savedWebsite.apiKeys[0].name).toBe('Test API Key');
  });
}); 