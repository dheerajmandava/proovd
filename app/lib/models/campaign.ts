import mongoose from 'mongoose';
const { Schema, models, model } = mongoose;

/**
 * Campaign Schema - Shopify Pricing Edition
 * Focused on price-point A/B testing for Shopify stores.
 */
const campaignSchema = new Schema(
    {
        siteId: {
            type: Schema.Types.ObjectId,
            required: [true, 'Site ID is required'],
            ref: 'Website',
        },
        name: {
            type: String,
            required: [true, 'Campaign name is required'],
            trim: true,
        },
        type: {
            type: String,
            enum: ['pricing'], // Only pricing for V0
            default: 'pricing',
        },
        status: {
            type: String,
            enum: ['draft', 'running', 'paused', 'ended'],
            default: 'draft',
        },
        // Shopify Price Testing Config
        pricingConfig: {
            productId: { type: String, trim: true },
            productHandle: { type: String, trim: true },
            productUrl: { type: String, trim: true },
            variants: [{
                variantId: { type: String, required: true },
                name: { type: String },
                price: { type: Number, required: true },
                cost: { type: Number, default: 0 },
                trafficPercent: { type: Number, default: 50 },
                impressions: { type: Number, default: 0 },
                conversions: { type: Number, default: 0 },
                revenue: { type: Number, default: 0 }
            }]
        },
        // Aggregate metrics
        impressions: { type: Number, default: 0 },
        conversions: { type: Number, default: 0 },
    },
    { timestamps: true }
);

// Indexes
campaignSchema.index({ siteId: 1 });
campaignSchema.index({ siteId: 1, status: 1 });
campaignSchema.index({ siteId: 1, type: 1 });

// Response method
campaignSchema.methods.toResponse = function () {
    return {
        id: this._id.toString(),
        name: this.name,
        type: this.type,
        status: this.status,
        pricingConfig: this.pricingConfig,
        impressions: this.impressions,
        conversions: this.conversions,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
    };
};

// Use same collection for backward compatibility
const Campaign = models.Campaign || model('Campaign', campaignSchema, 'notifications');

export default Campaign;
