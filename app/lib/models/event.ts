import mongoose from 'mongoose';
const { Schema, models, model } = mongoose;

// Define the Event schema
const eventSchema = new Schema(
  {
    siteId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Site ID is required'],
      ref: 'Website',
    },
    type: {
      type: String,
      enum: ['signup', 'purchase', 'view', 'custom'],
      required: [true, 'Event type is required'],
    },
    name: {
      type: String,
      trim: true,
    },
    data: {
      // For purchase events
      productName: {
        type: String,
        trim: true,
      },
      productId: {
        type: String,
        trim: true,
      },
      price: {
        type: Number,
      },
      currency: {
        type: String,
        trim: true,
      },
      // For signup events
      userEmail: {
        type: String,
        trim: true,
      },
      userName: {
        type: String,
        trim: true,
      },
      // For view events
      pageUrl: {
        type: String,
        trim: true,
      },
      pageTitle: {
        type: String,
        trim: true,
      },
      // For all events
      location: {
        type: String,
        trim: true,
      },
      customData: {
        type: Schema.Types.Mixed,
      },
    },
    // Meta information
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    referrer: {
      type: String,
      trim: true,
    },
    sessionId: {
      type: String,
      trim: true,
    },
    clientId: {
      type: String,
      trim: true,
    },
    isBot: {
      type: Boolean,
      default: false,
    },
    // Time tracking
    eventTime: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes for faster queries
eventSchema.index({ siteId: 1 });
eventSchema.index({ siteId: 1, type: 1 });
eventSchema.index({ siteId: 1, type: 1, eventTime: -1 });
eventSchema.index({ siteId: 1, 'data.productId': 1 });
eventSchema.index({ siteId: 1, 'data.pageUrl': 1 });

// Method to create a formatted response object
eventSchema.methods.toResponse = function () {
  return {
    id: this._id.toString(),
    type: this.type,
    name: this.name,
    data: this.data,
    eventTime: this.eventTime,
    createdAt: this.createdAt,
  };
};

// Use existing model or create a new one
const Event = models.Event || model('Event', eventSchema);

export default Event; 