import { VerificationMethod, VerificationStatus } from './domain-verification';

export interface Website {
  id: string;
  name: string;
  domain: string;
  status: 'pending' | 'verified' | 'failed';
  verification: {
    status: string;
    method: string;
    token: string;
    attempts: number;
    verifiedAt?: string;
  };
  createdAt: string;
  updatedAt?: string;
  apiKeys?: Array<{
    id: string;
    key: string;
    name: string;
    allowedOrigins: string[];
    createdAt: string;
    lastUsed?: string;
  }>;
  analytics?: {
    totalImpressions?: number;
    totalClicks?: number;
    conversionRate?: number;
    views?: number;
    conversions?: number;
    lastUpdated?: string;
  };
  settings?: {
    displayOrder?: string;
    displayLimit?: number;
    displayTimeout?: number;
    position?: string;
    theme?: string;
  };
} 