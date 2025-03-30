import mongoose, { Schema, Document } from 'mongoose';

// Define the interface for the website stats document
export interface IWebsiteStats extends Document {
  websiteId: string;
  activeUsers: number;
  totalClicks: number;
  avgScrollPercentage: number;
  avgTimeOnPage: number;
  usersByCountry: string; // JSON string representing users by country
  usersByCity: string; // JSON string representing users by city
  createdAt: Date;
  updatedAt: Date;
}

// Create the schema for website stats
const WebsiteStatsSchema: Schema = new Schema(
  {
    websiteId: {
      type: String,
      required: true,
      index: true
    },
    activeUsers: {
      type: Number,
      default: 0
    },
    totalClicks: {
      type: Number,
      default: 0
    },
    avgScrollPercentage: {
      type: Number,
      default: 0
    },
    avgTimeOnPage: {
      type: Number,
      default: 0
    },
    usersByCountry: {
      type: String,
      default: '{}'
    },
    usersByCity: {
      type: String,
      default: '{}'
    }
  },
  {
    timestamps: true
  }
);

// Create or get the model
export const WebsiteStats = mongoose.models.WebsiteStats || 
  mongoose.model<IWebsiteStats>('WebsiteStats', WebsiteStatsSchema);

export default WebsiteStats; 