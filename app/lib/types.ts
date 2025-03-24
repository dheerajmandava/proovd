import { VerificationMethod, VerificationStatus } from './domain-verification';

export interface Website {
  id: string;
  name: string;
  domain: string;
  status: string;
  userId: string;
  verification?: {
    status: 'pending' | 'verified' | 'failed';
    method: string;
    token: string;
    verifiedAt?: string;
  };
  settings?: {
    position: string;
    delay: number;
    displayDuration: number;
    maxNotifications: number;
    theme: string;
    displayOrder: string;
    randomize: boolean;
    initialDelay: number;
    loop: boolean;
    customStyles: string;
  };
  allowedDomains?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  siteId: string;
  name: string;
  type: string;
  message: string;
  url?: string;
  imagePath?: string;
  imageUrl?: string;
  status: 'active' | 'inactive' | 'draft';
  displayCount: number;
  clickCount: number;
  conversionRate: number;
  frequency?: {
    type: string;
    value: number;
  };
  location?: string;
  language?: string;
  targeting?: {
    pageUrls?: string[];
    devices?: string[];
    browsers?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  plan: string;
  role: string;
  createdAt: Date;
  lastLogin?: Date;
}

export interface VerificationDetails {
  status: VerificationStatus;
  method: VerificationMethod;
  token: string;
  verifiedAt?: string;
  attempts: number;
}

export interface WebsiteStats {
  totalImpressions: number;
  totalUniqueImpressions: number;
  totalClicks: number;
  conversionRate: string;
  metrics: {
    last24Hours: MetricsData;
    last7Days: MetricsData;
    last30Days: MetricsData;
  };
}

export interface MetricsData {
  impressions: number;
  uniqueImpressions: number;
  clicks: number;
  conversionRate: string;
}

export interface FormErrors {
  [key: string]: string;
} 