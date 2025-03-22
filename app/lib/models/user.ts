import mongoose, { Schema, Document } from 'mongoose';

// Define the User interface
export interface IUser extends Document {
  name: string;
  email: string;
  password?: string; // Optional for OAuth users
  image?: string;
  authProvider?: string;
  lastLogin?: Date;
  plan: 'free' | 'starter' | 'growth' | 'business';
  websites: {
    domain: string;
    settings: {
      position: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
      delay: number;
      displayDuration: number;
      maxNotifications: number;
      theme: string;
    };
  }[];
  apiKey: string;
  usageStats: {
    pageviews: number;
    lastReset: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Define the User schema
const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String }, // Optional for OAuth users but REQUIRED for credential users
    image: { type: String },
    authProvider: { type: String, enum: ['credentials', 'google'], default: 'credentials' },
    lastLogin: { type: Date, default: Date.now },
    plan: { 
      type: String, 
      required: true, 
      enum: ['free', 'starter', 'growth', 'business'],
      default: 'free'
    },
    websites: [{
      domain: { type: String, required: true },
      settings: {
        position: { 
          type: String, 
          enum: ['bottom-left', 'bottom-right', 'top-left', 'top-right'],
          default: 'bottom-left'
        },
        delay: { type: Number, default: 5 },
        displayDuration: { type: Number, default: 5 },
        maxNotifications: { type: Number, default: 5 },
        theme: { type: String, default: 'light' }
      }
    }],
    apiKey: { type: String, required: true, unique: true },
    usageStats: {
      pageviews: { type: Number, default: 0 },
      lastReset: { type: Date, default: Date.now }
    }
  },
  { timestamps: true }
);

// Create and export the User model
export default mongoose.models.User || 
  mongoose.model<IUser>('User', UserSchema); 