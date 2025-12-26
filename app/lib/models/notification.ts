import mongoose from 'mongoose';
const { Schema, models, model } = mongoose;

// Define the Notification schema
const notificationSchema = new Schema(
  {
    siteId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Site ID is required'],
      ref: 'Website',
    },
    name: {
      type: String,
      required: [true, 'Notification name is required'],
      trim: true,
    },
    type: {
      type: String,
      // Added new CRO types, kept old ones for backward compatibility
      enum: ['popup', 'sticky-bar', 'slide-in', 'inline-banner', 'purchase', 'signup', 'custom', 'conversion'],
      default: 'popup',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'draft', 'paused'],
      default: 'active',
    },
    // New Campaign Content Fields
    content: {
      title: { type: String, trim: true },
      body: { type: String, trim: true },
      ctaText: { type: String, trim: true },
      ctaUrl: { type: String, trim: true },
      image: { type: String, trim: true },
    },
    // Behavioral Triggers
    triggers: [{
      type: {
        type: String,
        enum: ['scroll', 'timeOnPage', 'exitIntent', 'pageUrl', 'device', 'isReturning']
      },
      operator: { type: String }, // '>', '<', 'contains', 'equals'
      value: { type: Schema.Types.Mixed }, // number, string, boolean
      enabled: { type: Boolean, default: true }
    }],
    // A/B Testing Variants
    variants: [{
      id: { type: String },
      content: {
        title: String,
        body: String,
        ctaText: String,
        ctaUrl: String,
        image: String
      },
      traffic: { type: Number, default: 50 }, // Percentage of traffic
      impressions: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 }
    }],
    // Display Settings
    position: {
      type: String,
      default: 'bottom-right'
    },
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    // Legacy fields below (kept for backward compatibility)
    location: {
      type: String,
      default: 'global',
      trim: true,
    },
    productName: {
      type: String,
      trim: true,
    },
    message: {
      type: String,
      trim: true,
    },
    url: {
      type: String,
      trim: true,
    },
    // @deprecated - Only kept for backward compatibility, use 'url' instead
    link: {
      type: String,
      trim: true,
    },
    urlTarget: {
      type: String,
      enum: ['_self', '_blank', 'new'],
      default: '_blank',
    },
    image: {
      type: String,
      trim: true,
    },
    displayRules: {
      pages: {
        type: [String],
        default: [],
      },
      frequency: {
        type: String,
        enum: ['always', 'once', 'daily', 'once_per_session', 'once_per_visitor'],
        default: 'always',
      },
      delay: {
        type: Number,
        default: 0,
      },
      startDate: {
        type: Date,
      },
      endDate: {
        type: Date,
      },
    },
    // New display settings
    displayFrequency: {
      type: String,
      enum: ['always', 'once_per_session', 'once_per_browser', 'once_per_visitor'],
      default: 'always',
    },
    displayDuration: {
      type: Number,
      min: 0, // Changed min to 0 to allow infinite display
      max: 3600, // Increased max
      default: 0, // Default 0 means stay until closed
    },
    timeAgo: {
      type: String,
      trim: true,
    },
    fakeTimestamp: {
      type: Date,
    },
    priority: {
      type: Number,
      default: 1,
    },
    displayCount: {
      type: Number,
      default: 0,
    },
    impressions: {
      type: Number,
      default: 0,
    },
    clicks: {
      type: Number,
      default: 0,
    },
    uniqueImpressionCount: {
      type: Number,
      default: 0,
    },
    clickCount: {
      type: Number,
      default: 0,
    },
    components: {
      type: Array,
      default: [],
      select: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes for faster queries
notificationSchema.index({ siteId: 1 });
notificationSchema.index({ siteId: 1, status: 1 });
notificationSchema.index({ siteId: 1, location: 1 });
notificationSchema.index({ siteId: 1, priority: -1 }); // For priority order

// Pre-save middleware to handle backward compatibility with link field
notificationSchema.pre('save', function (next) {
  // If link is set but url is not, copy link to url (backward compatibility)
  if (this.link && !this.url) {
    this.url = this.link;
  }
  next();
});

// Method to create a formatted response object
notificationSchema.methods.toResponse = function () {
  const response = {
    id: this._id.toString(),
    name: this.name,
    type: this.type,
    status: this.status,

    // New Campaign Fields
    content: this.content,
    triggers: this.triggers,
    variants: this.variants,
    position: this.position,
    theme: this.theme,

    // Legacy mapping
    location: this.location,
    productName: this.productName,
    message: this.message || (this.content ? this.content.body : ''),
    url: this.url || this.link || (this.content ? this.content.ctaUrl : ''),
    urlTarget: this.urlTarget,
    image: this.image || (this.content ? this.content.image : ''),

    displayRules: this.displayRules,
    displayFrequency: this.displayFrequency,
    displayDuration: this.displayDuration,
    timeAgo: this.timeAgo,
    fakeTimestamp: this.fakeTimestamp,
    priority: this.priority,
    impressions: this.impressions,
    clicks: this.clicks,
    components: this.components || [],
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };

  // Debug log to ensure components are included
  if (this.components && this.components.length > 0) {
    console.log(`toResponse: Including ${this.components.length} components for notification ${this._id}`);
  }

  return response;
};

// Use existing model or create a new one
const Notification = models.Notification || model('Notification', notificationSchema);

export default Notification; 