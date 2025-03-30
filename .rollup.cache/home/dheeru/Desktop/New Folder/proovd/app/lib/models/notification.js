import mongoose from 'mongoose';
const { Schema, models, model } = mongoose;
// Define the Notification schema
const notificationSchema = new Schema({
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
        enum: ['purchase', 'signup', 'custom', 'conversion'],
        default: 'custom',
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'draft'],
        default: 'active',
    },
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
            enum: ['always', 'once', 'daily'],
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
        enum: ['always', 'once_per_session', 'once_per_browser'],
        default: 'always',
    },
    displayDuration: {
        type: Number,
        min: 1,
        max: 60,
        default: 5,
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
}, {
    timestamps: true,
});
// Add indexes for faster queries
notificationSchema.index({ siteId: 1 });
notificationSchema.index({ siteId: 1, status: 1 });
notificationSchema.index({ siteId: 1, location: 1 });
notificationSchema.index({ siteId: 1, priority: -1 }); // For priority order
// Method to create a formatted response object
notificationSchema.methods.toResponse = function () {
    return {
        id: this._id.toString(),
        name: this.name,
        type: this.type,
        status: this.status,
        location: this.location,
        productName: this.productName,
        message: this.message,
        url: this.url,
        urlTarget: this.urlTarget,
        image: this.image,
        displayRules: this.displayRules,
        displayFrequency: this.displayFrequency,
        displayDuration: this.displayDuration,
        timeAgo: this.timeAgo,
        fakeTimestamp: this.fakeTimestamp,
        priority: this.priority,
        impressions: this.impressions,
        clicks: this.clicks,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
    };
};
// Use existing model or create a new one
const Notification = models.Notification || model('Notification', notificationSchema);
export default Notification;
