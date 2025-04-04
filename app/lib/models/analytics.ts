import { Schema, model, models } from 'mongoose';

const AnalyticsEventSchema = new Schema({
  websiteId: { type: Schema.Types.ObjectId, ref: 'Website', required: true },
  notificationId: { type: Schema.Types.ObjectId, ref: 'Notification', required: true },
  type: { type: String, enum: ['impression', 'click'], required: true },
  timestamp: { type: Date, default: Date.now },
  metadata: {
    url: String,
    referrer: String,
    userAgent: String,
    deviceType: String,
    country: String,
  }
}, { timestamps: true });

// Create indexes for efficient querying
AnalyticsEventSchema.index({ websiteId: 1, timestamp: -1 });
AnalyticsEventSchema.index({ notificationId: 1, timestamp: -1 });
AnalyticsEventSchema.index({ type: 1, timestamp: -1 });

const AnalyticsSummarySchema = new Schema({
  websiteId: { type: Schema.Types.ObjectId, ref: 'Website', required: true },
  date: { type: Date, required: true },
  granularity: { type: String, enum: ['daily', 'weekly', 'monthly'], required: true },
  metrics: {
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    uniqueImpressions: { type: Number, default: 0 },
    uniqueClicks: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
  },
  notificationMetrics: [{
    notificationId: { type: Schema.Types.ObjectId, ref: 'Notification' },
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
  }]
}, { timestamps: true });

// Create indexes for efficient querying
AnalyticsSummarySchema.index({ websiteId: 1, date: -1, granularity: 1 });

// Create or get models
export const AnalyticsEvent = models.AnalyticsEvent || model('AnalyticsEvent', AnalyticsEventSchema);
export const AnalyticsSummary = models.AnalyticsSummary || model('AnalyticsSummary', AnalyticsSummarySchema);

export default {
  AnalyticsEvent,
  AnalyticsSummary
}; 