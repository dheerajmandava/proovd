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
      enum: ['purchase', 'signup', 'custom'],
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
  },
  {
    timestamps: true,
  }
);

// Add indexes for faster queries
notificationSchema.index({ siteId: 1 });
notificationSchema.index({ siteId: 1, status: 1 });
notificationSchema.index({ siteId: 1, location: 1 });

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
    image: this.image,
    displayRules: this.displayRules,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

// Use existing model or create a new one
const Notification = models.Notification || model('Notification', notificationSchema);

export default Notification; 