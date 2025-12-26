import { connectToDatabase, mongoose, withDatabaseConnection } from '../database/connection';
import { cache } from 'react';
import Website from '../models/website';
import { VerificationMethod, VerificationStatus, VerificationDetails } from '@/app/lib/domain-verification';

type WebsiteWithAnalytics = {
  _id: string;
  userId: string;
  name: string;
  domain: string;
  status: string;
  analytics: {
    totalImpressions: number;
    totalClicks: number;
    conversionRate: number;
  };
  settings: {
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
    [key: string]: any;
  };
  allowedDomains?: string[];
  shopify?: {
    shop: string;
    isActive: boolean;
    installedAt: Date;
  };
  cachedStats?: {
    totalImpressions: number;
    totalClicks: number;
    conversionRate: number;
  };
  createdAt: Date;
  updatedAt: Date;
};

// Helper function to convert MongoDB document to WebsiteWithAnalytics
function convertToWebsiteWithAnalytics(website: any): WebsiteWithAnalytics {
  return {
    _id: website._id.toString(),
    userId: website.userId.toString(),
    name: website.name,
    domain: website.domain,
    status: website.status,
    analytics: {
      totalImpressions: website.impressions || 0,
      totalClicks: website.clicks || 0,
      conversionRate: website.clicks && website.impressions ?
        (website.clicks / website.impressions) * 100 : 0
    },
    settings: website.settings || {
      position: 'bottom-left',
      delay: 5,
      displayDuration: 5,
      maxNotifications: 5,
      theme: 'light',
      displayOrder: 'newest',
      randomize: false,
      initialDelay: 5,
      loop: false,
      customStyles: ''
    },
    allowedDomains: website.allowedDomains || [],
    shopify: website.shopify ? {
      shop: website.shopify.shop,
      isActive: website.shopify.isActive,
      installedAt: website.shopify.installedAt
    } : undefined,
    createdAt: website.createdAt,
    updatedAt: website.updatedAt
  };
}

/**
 * Get a website by ID with cached results for server components
 * @param id Website ID
 * @returns Website data or null if not found
 */
export const getWebsiteById = cache(async (id: string): Promise<WebsiteWithAnalytics | null> => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return null;

  return withDatabaseConnection(async () => {
    const website = await Website.findById(id).lean();
    if (!website) return null;

    return convertToWebsiteWithAnalytics(website);
  });
});

/**
 * Get all websites for a user
 * @param userId User ID
 * @returns Array of websites
 */
export const getWebsitesByUserId = cache(async (userId: string): Promise<WebsiteWithAnalytics[]> => {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return [];

  return withDatabaseConnection(async () => {
    const websites = await Website.find({ userId }).lean();
    return websites.map(convertToWebsiteWithAnalytics);
  });
});

/**
 * Get a website by domain
 * @param domain Website domain
 * @returns Website data or null if not found
 */
export async function getWebsiteByDomain(domain: string): Promise<WebsiteWithAnalytics | null> {
  if (!domain) return null;

  return withDatabaseConnection(async () => {
    const website = await Website.findOne({ domain: domain.toLowerCase() }).lean();
    if (!website) return null;

    return convertToWebsiteWithAnalytics(website);
  });
}

/**
 * Create a new website
 * @param websiteData Website data to create
 * @returns Created website
 */
export async function createWebsite(websiteData: {
  name: string;
  domain: string;
  userId: string;
  status?: string;
  verification?: any;
  settings?: Record<string, any>;
}): Promise<WebsiteWithAnalytics> {
  await connectToDatabase();

  const website = new Website({
    name: websiteData.name,
    domain: websiteData.domain.toLowerCase(),
    userId: websiteData.userId,
    status: websiteData.status || 'pending',
    verification: websiteData.verification || {
      status: VerificationStatus.PENDING,
      method: VerificationMethod.DNS,
      token: '',
      attempts: 0
    },
    settings: websiteData.settings || {},
    analytics: {
      totalImpressions: 0,
      totalClicks: 0,
      conversionRate: 0
    }
  });

  await website.save();
  return website.toObject() as WebsiteWithAnalytics;
}

/**
 * Update website settings
 * @param id Website ID
 * @param settings Settings to update
 * @returns Updated website or null if not found
 */
export async function updateWebsiteSettings(
  id: string,
  settings: Record<string, any>
): Promise<WebsiteWithAnalytics | null> {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return null;

  await connectToDatabase();

  // Find the website
  const website = await Website.findById(id);
  if (!website) return null;

  // Update settings
  if (settings.position) website.settings.position = settings.position;
  if (settings.delay !== undefined) website.settings.delay = parseInt(settings.delay.toString(), 10);
  if (settings.displayDuration !== undefined) website.settings.displayDuration = parseInt(settings.displayDuration.toString(), 10);
  if (settings.maxNotifications !== undefined) website.settings.maxNotifications = parseInt(settings.maxNotifications.toString(), 10);
  if (settings.theme) website.settings.theme = settings.theme;
  if (settings.displayOrder) website.settings.displayOrder = settings.displayOrder;
  if (settings.randomize !== undefined) website.settings.randomize = Boolean(settings.randomize);
  if (settings.initialDelay !== undefined) website.settings.initialDelay = parseInt(settings.initialDelay.toString(), 10);
  if (settings.loop !== undefined) website.settings.loop = Boolean(settings.loop);
  if (settings.customStyles !== undefined) website.settings.customStyles = settings.customStyles;

  // Update other fields
  if (settings.name) website.name = settings.name;
  if (settings.allowedDomains) website.allowedDomains = settings.allowedDomains;
  if (settings.status) website.status = settings.status;

  // Save changes
  await website.save();

  // Return updated website
  const updatedWebsite = await Website.findById(id).lean();
  return updatedWebsite ? convertToWebsiteWithAnalytics(updatedWebsite) : null;
}

/**
 * Increment website impressions and update conversion rate
 * @param id Website ID
 * @param count Number to increment by
 * @returns Updated website or null if not found
 */
export async function incrementWebsiteImpressions(
  id: string,
  count: number = 1
): Promise<WebsiteWithAnalytics | null> {
  if (!id || !mongoose.Types.ObjectId.isValid(id) || count <= 0) return null;

  await connectToDatabase();

  const website = await Website.findById(id);
  if (!website) return null;

  // Initialize analytics if they don't exist
  if (!website.analytics) {
    website.analytics = {
      totalImpressions: 0,
      totalClicks: 0,
      conversionRate: 0
    };
  }

  // Increment impressions
  website.analytics.totalImpressions += count;

  // Recalculate conversion rate
  if (website.analytics.totalImpressions > 0) {
    website.analytics.conversionRate =
      (website.analytics.totalClicks / website.analytics.totalImpressions) * 100;
  }

  await website.save();
  return website.toObject() as WebsiteWithAnalytics;
}

/**
 * Increment website clicks and update conversion rate
 * @param id Website ID
 * @param count Number to increment by
 * @returns Updated website or null if not found
 */
export async function incrementWebsiteClicks(
  id: string,
  count: number = 1
): Promise<WebsiteWithAnalytics | null> {
  if (!id || !mongoose.Types.ObjectId.isValid(id) || count <= 0) return null;

  await connectToDatabase();

  const website = await Website.findById(id);
  if (!website) return null;

  // Initialize analytics if they don't exist
  if (!website.analytics) {
    website.analytics = {
      totalImpressions: 0,
      totalClicks: 0,
      conversionRate: 0
    };
  }

  // Increment clicks
  website.analytics.totalClicks += count;

  // Recalculate conversion rate
  if (website.analytics.totalImpressions > 0) {
    website.analytics.conversionRate =
      (website.analytics.totalClicks / website.analytics.totalImpressions) * 100;
  }

  await website.save();
  return website.toObject() as WebsiteWithAnalytics;
}

/**
 * Delete a website
 * @param id Website ID
 * @returns True if deleted, false if not found
 */
export async function deleteWebsite(id: string): Promise<boolean> {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return false;

  await connectToDatabase();
  const result = await Website.deleteOne({ _id: id });
  return result.deletedCount > 0;
}

/**
 * Get a website by its API key
 */
export async function getWebsiteByApiKey(apiKey: string): Promise<WebsiteWithAnalytics | null> {
  if (!apiKey) return null;

  try {
    await connectToDatabase();
    const website = await Website.findOne({ apiKey }).lean();
    return website ? convertToWebsiteWithAnalytics(website) : null;
  } catch (error) {
    console.error('Error fetching website by API key:', error);
    return null;
  }
}

/**
 * Get website verification details
 * @param id Website ID
 * @param userId User ID
 * @returns Website with verification details or null if not found
 */
export async function getWebsiteVerification(id: string, userId: string): Promise<any> {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return null;

  await connectToDatabase();
  const website = await Website.findOne({
    _id: id,
    userId
  }).lean();

  return website;
}

/**
 * Update website verification method
 * @param id Website ID
 * @param method Verification method
 * @param token Verification token
 * @returns Updated website or null if not found
 */
export async function updateWebsiteVerificationMethod(
  id: string,
  method: string,
  token?: string
): Promise<any> {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return null;

  await connectToDatabase();

  const crypto = require('crypto');

  const verification: VerificationDetails = {
    status: VerificationStatus.PENDING,
    method: method as VerificationMethod,
    token: token || crypto.randomBytes(16).toString('hex'),
    attempts: 0
  };

  const website = await Website.findByIdAndUpdate(
    id,
    { $set: { verification } },
    { new: true }
  ).lean();

  return website;
}

/**
 * Update website verification status
 * @param id Website ID
 * @param isVerified Whether the domain was verified
 * @param reason Reason for verification failure
 * @returns Updated website or null if not found
 */
export async function updateWebsiteVerificationStatus(
  id: string,
  isVerified: boolean,
  reason?: string
): Promise<any> {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return null;

  return withDatabaseConnection(async () => {
    const website = await Website.findById(id);
    if (!website) return null;

    // Update verification attempts
    if (!website.verification) {
      website.verification = {
        status: VerificationStatus.PENDING,
        method: VerificationMethod.DNS,
        token: '',
        attempts: 0
      };
    }

    // Ensure the verification object has an attempts field
    if (!website.verification.attempts) {
      website.verification.attempts = 0;
    }

    website.verification.attempts = (website.verification.attempts || 0) + 1;

    // If verified, update status
    if (isVerified) {
      website.verification.status = VerificationStatus.VERIFIED;
      website.verification.verifiedAt = new Date();
      website.status = 'verified';
    } else if (website.verification.status !== VerificationStatus.VERIFIED) {
      // Only set to pending if not already verified
      website.verification.status = VerificationStatus.PENDING;
    }

    await website.save();
    return website.toObject();
  });
}

/**
 * Get all websites for a user (raw data)
 * @param userId User ID
 * @returns Array of websites (raw data)
 */
export async function getWebsitesRaw(userId: string): Promise<any[]> {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return [];

  await connectToDatabase();
  const websites = await Website.find({ userId }).sort({ createdAt: -1 }).lean();

  return websites;
} 