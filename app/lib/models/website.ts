import mongoose, { Schema, models, model, Document, Model } from 'mongoose';
import { VerificationMethod, VerificationStatus } from '@/app/lib/domain-verification';
import { generateWebsiteId } from '../server-utils';
import { retryDbOperation } from './db-utils';

// Define the Website document interface
export interface WebsiteDocument extends Document {
  name: string;
  domain: string;
  userId: mongoose.Types.ObjectId;
  status: string;
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
  verification?: {
    status: VerificationStatus;
    method?: VerificationMethod;
    token?: string;
    verifiedAt?: Date;
  };
  analytics?: {
    totalImpressions: number;
    totalClicks: number;
    conversionRate: number;
    dailyStats?: any[];
  };
  allowedDomains?: string[];
  createdAt: Date;
  updatedAt: Date;
  toJSON(): any;
}

// Define the Website model type with retry methods
export interface WebsiteModel extends Model<WebsiteDocument> {
  findOneWithRetry(filter: any): Promise<WebsiteDocument | null>;
  findByIdWithRetry(id: string): Promise<WebsiteDocument | null>;
  findWithRetry(filter: any): Promise<WebsiteDocument[]>;
  updateOneWithRetry(filter: any, update: any): Promise<any>;
}

// Define the Website schema
const websiteSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Website name is required'],
      trim: true,
    },
    domain: {
      type: String,
      required: [true, 'Domain is required'],
      trim: true,
      lowercase: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: [true, 'User ID is required'],
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending', 'verified'],
      default: 'pending',
    },
    settings: {
      position: {
        type: String,
        enum: ['bottom-left', 'bottom-right', 'top-left', 'top-right'],
        default: 'bottom-left',
      },
      delay: {
        type: Number,
        default: 5,
      },
      displayDuration: {
        type: Number,
        default: 5,
      },
      maxNotifications: {
        type: Number,
        default: 5,
      },
      theme: {
        type: String,
        enum: ['light', 'dark', 'custom'],
        default: 'light',
      },
      displayOrder: {
        type: String,
        enum: ['newest', 'random', 'smart'],
        default: 'newest',
      },
      randomize: {
        type: Boolean,
        default: false,
      },
      initialDelay: {
        type: Number,
        default: 5,
      },
      loop: {
        type: Boolean,
        default: false,
      },
      customStyles: {
        type: String,
        default: '',
      },
    },
    allowedDomains: {
      type: [String],
      default: [],
    },
    verification: {
      status: {
        type: String,
        enum: ['pending', 'verified', 'failed'],
        default: 'pending',
      },
      method: {
        type: String,
        enum: Object.values(VerificationMethod),
        default: VerificationMethod.DNS,
      },
      token: {
        type: String,
        required: false,
        default: () => require('crypto').randomBytes(16).toString('hex'),
      },
      verifiedAt: String,
      attempts: {
        type: Number,
        default: 0,
      },
    },
    analytics: {
      totalImpressions: {
        type: Number,
        default: 0,
      },
      totalClicks: {
        type: Number,
        default: 0,
      },
      dailyStats: [{
        date: {
          type: String, // Store as ISO date string (YYYY-MM-DD)
          required: true,
        },
        impressions: {
          type: Number,
          default: 0,
        },
        clicks: {
          type: Number,
          default: 0,
        },
        conversionRate: {
          type: Number,
          default: 0,
        },
      }],
      conversionRate: {
        type: Number,
        default: 0,
      },
    },
    cachedStats: {
      totalImpressions: Number,
      totalUniqueImpressions: Number,
      totalClicks: Number,
      conversionRate: String,
      metrics: {
        last24Hours: {
          impressions: Number,
          uniqueImpressions: Number,
          clicks: Number,
          conversionRate: String,
        },
        last7Days: {
          impressions: Number,
          uniqueImpressions: Number,
          clicks: Number,
          conversionRate: String,
        },
        last30Days: {
          impressions: Number,
          uniqueImpressions: Number,
          clicks: Number,
          conversionRate: String,
        },
      },
      lastUpdated: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes
websiteSchema.index({ userId: 1 });
websiteSchema.index({ domain: 1 });

// Compound index to prevent duplicate domains for a user
websiteSchema.index({ userId: 1, domain: 1 }, { unique: true });

// Pre-save middleware to process domain
websiteSchema.pre('save', function(next) {
  // Normalize domain (remove http://, https://, www. prefixes)
  if (this.domain) {
    try {
      // Remove protocol and www
      let domain = this.domain.toLowerCase();
      if (domain.startsWith('http://')) {
        domain = domain.substring(7);
      } else if (domain.startsWith('https://')) {
        domain = domain.substring(8);
      }
      
      if (domain.startsWith('www.')) {
        domain = domain.substring(4);
      }
      
      // Remove trailing slash if present
      if (domain.endsWith('/')) {
        domain = domain.slice(0, -1);
      }
      
      this.domain = domain;
    } catch (err) {
      console.error('Error normalizing domain:', err);
    }
  }
  
  // If verification object exists but token is missing, set a default token
  if (this.verification && (!this.verification.token || this.verification.token.length === 0)) {
    const crypto = require('crypto');
    this.verification.token = crypto.randomBytes(16).toString('hex');
  }
  
  // If verification object doesn't exist, create it with defaults
  if (!this.verification) {
    const crypto = require('crypto');
    this.verification = {
      status: 'pending',
      method: VerificationMethod.DNS,
      token: crypto.randomBytes(16).toString('hex'),
      attempts: 0
    };
  }
  
  next();
});

// Instance method to record an impression
websiteSchema.methods.recordImpression = async function() {
  try {
    // Get today's date as ISO string (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];
    
    // Find today's stats in dailyStats array
    let todayStats = this.analytics.dailyStats.find(
      (stat: { date: string }) => stat.date === today
    );
    
    if (todayStats) {
      // Update existing stats
      todayStats.impressions += 1;
      
      // Recalculate conversion rate
      if (todayStats.impressions > 0) {
        todayStats.conversionRate = (todayStats.clicks / todayStats.impressions) * 100;
      }
    } else {
      // Create new daily stats
      this.analytics.dailyStats.push({
        date: today,
        impressions: 1,
        clicks: 0,
        conversionRate: 0
      });
    }
    
    // Update total impressions
    this.analytics.totalImpressions += 1;
    
    // Recalculate overall conversion rate
    if (this.analytics.totalImpressions > 0) {
      this.analytics.conversionRate = (this.analytics.totalClicks / this.analytics.totalImpressions) * 100;
    }
    
    // Save the changes
    await this.save();
  } catch (err) {
    console.error('Error recording impression:', err);
  }
};

// Instance method to record a click
websiteSchema.methods.recordClick = async function() {
  try {
    // Get today's date as ISO string (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];
    
    // Find today's stats in dailyStats array
    let todayStats = this.analytics.dailyStats.find(
      (stat: { date: string }) => stat.date === today
    );
    
    if (todayStats) {
      // Update existing stats
      todayStats.clicks += 1;
      
      // Recalculate conversion rate
      if (todayStats.impressions > 0) {
        todayStats.conversionRate = (todayStats.clicks / todayStats.impressions) * 100;
      }
    } else {
      // Create new daily stats with a click but no impression yet
      this.analytics.dailyStats.push({
        date: today,
        impressions: 0,
        clicks: 1,
        conversionRate: 100 // 100% conversion if click without impression
      });
    }
    
    // Update total clicks
    this.analytics.totalClicks += 1;
    
    // Recalculate overall conversion rate
    if (this.analytics.totalImpressions > 0) {
      this.analytics.conversionRate = (this.analytics.totalClicks / this.analytics.totalImpressions) * 100;
    }
    
    // Save the changes
    await this.save();
  } catch (err) {
    console.error('Error recording click:', err);
  }
};

// Method to create a formatted response object
websiteSchema.methods.toResponse = function() {
  // First create a clean object with only the data we want
  const verification = this.verification ? {
    status: this.verification.status || 'pending',
    method: this.verification.method || '',
    token: this.verification.token || '',
    verifiedAt: this.verification.verifiedAt || '',
    attempts: this.verification.attempts || 0
  } : {};
  
  const settings = this.settings ? {
    position: this.settings.position || 'bottom-left',
    delay: this.settings.delay || 5,
    displayDuration: this.settings.displayDuration || 5,
    maxNotifications: this.settings.maxNotifications || 5,
    theme: this.settings.theme || 'light',
    displayOrder: this.settings.displayOrder || 'newest',
    randomize: this.settings.randomize || false,
    initialDelay: this.settings.initialDelay || 5,
    loop: this.settings.loop || false,
    customStyles: this.settings.customStyles || ''
  } : {};
  
  const dailyStats = Array.isArray(this.analytics?.dailyStats) ? 
    this.analytics.dailyStats.map((stat: { 
      date: string; 
      impressions: number; 
      clicks: number; 
      conversionRate: number;
    }) => ({
      date: stat.date || '',
      impressions: stat.impressions || 0,
      clicks: stat.clicks || 0,
      conversionRate: stat.conversionRate || 0
    })) : [];
    
  // Then create the final response object
  const responseObj = {
    id: this._id.toString(),
    name: this.name || '',
    domain: this.domain || '',
    status: this.status || 'pending',
    verification: verification,
    settings: settings,
    allowedDomains: Array.isArray(this.allowedDomains) ? [...this.allowedDomains] : [],
    analytics: {
      totalImpressions: this.analytics?.totalImpressions || 0,
      totalClicks: this.analytics?.totalClicks || 0,
      conversionRate: this.analytics?.conversionRate || 0,
      dailyStats: dailyStats
    },
    createdAt: this.createdAt || new Date(),
    updatedAt: this.updatedAt || new Date(),
  };
  
  // Force clean JSON serialization to remove any potential circular references
  return JSON.parse(JSON.stringify(responseObj));
};

// Add retry methods to the schema
websiteSchema.statics.findOneWithRetry = function(filter: any) {
  return retryDbOperation(() => this.findOne(filter));
};

websiteSchema.statics.findByIdWithRetry = function(id: string) {
  return retryDbOperation(() => this.findById(id));
};

websiteSchema.statics.findWithRetry = function(filter: any) {
  return retryDbOperation(() => this.find(filter));
};

websiteSchema.statics.updateOneWithRetry = function(filter: any, update: any) {
  return retryDbOperation(() => this.updateOne(filter, update));
};

// Create or reuse the model
const Website = (models.Website || model('Website', websiteSchema)) as WebsiteModel;

export default Website;
