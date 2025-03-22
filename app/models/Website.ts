import mongoose, { Schema, Document } from 'mongoose';
import { VerificationMethod, VerificationStatus } from '@/app/lib/domain-verification';
import { generateApiKey } from '@/app/lib/api-key';

export interface ApiKey {
  id: string;
  key: string;
  name: string;
  allowedOrigins: string[];
  createdAt: string;
  lastUsed?: string;
}

export interface Verification {
  status: VerificationStatus;
  method: VerificationMethod;
  token: string;
  attempts: number;
  verifiedAt?: string;
}

export interface IWebsite extends Document {
  userId: string;
  name: string;
  domain: string;
  status: string;
  verification: Verification;
  apiKeys: ApiKey[];
  notifications: mongoose.Types.ObjectId[];
  settings: {
    displayOrder: string;
    displayLimit: number;
    displayTimeout: number;
    position: string;
    theme: string;
    customStyles: string;
  };
  analytics: {
    views: number;
    conversions: number;
    lastUpdated: Date;
  };
  plan: string;
  createdAt: Date;
  updatedAt: Date;
}

const WebsiteSchema = new Schema<IWebsite>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    domain: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    status: {
      type: String,
      enum: ['pending', 'verified', 'blocked'],
      default: 'pending',
    },
    verification: {
      status: {
        type: String,
        enum: Object.values(VerificationStatus),
        default: VerificationStatus.PENDING,
      },
      method: {
        type: String,
        enum: Object.values(VerificationMethod),
        default: VerificationMethod.DNS,
      },
      token: {
        type: String,
      },
      attempts: {
        type: Number,
        default: 0,
      },
      verifiedAt: {
        type: Date,
      },
    },
    apiKeys: {
      type: [
        {
          id: String,
          key: String,
          name: String,
          allowedOrigins: [String],
          createdAt: String,
          lastUsed: String,
        },
      ],
      default: [], // Start with empty array - no API keys until verified
    },
    notifications: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Notification',
      },
    ],
    settings: {
      displayOrder: {
        type: String,
        enum: ['newest', 'random', 'smart'],
        default: 'newest',
      },
      displayLimit: {
        type: Number,
        default: 5,
      },
      displayTimeout: {
        type: Number,
        default: 5,
      },
      position: {
        type: String,
        enum: ['bottom-left', 'bottom-right', 'top-left', 'top-right'],
        default: 'bottom-left',
      },
      theme: {
        type: String,
        enum: ['light', 'dark', 'custom'],
        default: 'light',
      },
      customStyles: {
        type: String,
        default: '',
      },
    },
    analytics: {
      views: {
        type: Number,
        default: 0,
      },
      conversions: {
        type: Number,
        default: 0,
      },
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
    },
    plan: {
      type: String,
      enum: ['free', 'starter', 'professional', 'enterprise'],
      default: 'free',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate domains for a user
WebsiteSchema.index({ userId: 1, domain: 1 }, { unique: true });

// Create the Website model
const Website = mongoose.models.Website || mongoose.model<IWebsite>('Website', WebsiteSchema);

export default Website; 