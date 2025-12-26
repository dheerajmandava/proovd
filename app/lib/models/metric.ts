import mongoose from 'mongoose';
const { Schema, models, model } = mongoose;

// Define the Metric schema
const metricSchema = new Schema(
  {
    siteId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Site ID is required'],
      ref: 'Website',
    },
    notificationId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Notification ID is required'],
      ref: 'Notification',
    },
    type: {
      type: String,
      enum: ['impression', 'click', 'conversion'],
      required: [true, 'Type is required'],
    },
    variantId: {
      type: String,
      index: true,
    },
    conversionValue: {
      type: Number,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    url: {
      type: String,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    deviceInfo: {
      type: {
        type: String,
        enum: ['desktop', 'mobile', 'tablet'],
      },
      browser: String,
      os: String,
    },
    sessionId: {
      type: String,
      index: true,
    },
    clientId: {
      type: String,
      index: true,
    },
    isBot: {
      type: Boolean,
      default: false,
      index: true,
    },
    ipAddress: {
      type: String,
    },
    referrer: {
      type: String,
    },
    isUnique: {
      type: Boolean,
      default: true,
    }
  },
  {
    timestamps: true,
  }
);

// Add indexes for faster queries and analytics
metricSchema.index({ siteId: 1, type: 1 });
metricSchema.index({ notificationId: 1, type: 1 });
metricSchema.index({ timestamp: 1 });
metricSchema.index({ siteId: 1, timestamp: 1 });
metricSchema.index({ notificationId: 1, timestamp: 1 });
metricSchema.index({ sessionId: 1, notificationId: 1, type: 1 });
metricSchema.index({ clientId: 1, notificationId: 1, type: 1 });
metricSchema.index({ isBot: 1 });
metricSchema.index({ isUnique: 1 });

// Method to create a formatted response object
metricSchema.methods.toResponse = function () {
  return {
    id: this._id.toString(),
    siteId: this.siteId.toString(),
    notificationId: this.notificationId.toString(),
    type: this.type,
    url: this.url,
    timestamp: this.timestamp,
    deviceInfo: this.deviceInfo,
    sessionId: this.sessionId,
    clientId: this.clientId,
    isBot: this.isBot,
    isUnique: this.isUnique,
    referrer: this.referrer,
    createdAt: this.createdAt,
  };
};

// Use existing model or create a new one
const Metric = models.Metric || model('Metric', metricSchema);

export default Metric; 