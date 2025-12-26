const mongoose = require('mongoose');
const { Schema } = mongoose;
require('dotenv').config({ path: '.env.local' });

const notificationSchema = new Schema({
    siteId: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    status: { type: String, default: 'active' },
    content: {
        title: String,
        body: String,
        ctaText: String,
        ctaUrl: String,
        image: String,
        icon: String,
    },
    triggers: [{
        type: { type: String },
        value: Schema.Types.Mixed,
        operator: String
    }],
    variants: [{
        id: String,
        content: {
            title: String,
            body: String,
            ctaText: String,
            ctaUrl: String,
            image: String,
            icon: String,
        }
    }],
    position: String,
    theme: String,
    displayRules: Schema.Types.Mixed,
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
}, { timestamps: true });

const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

async function createABTest() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const campaign = new Notification({
            siteId: '694bdac48b22ee70839d1a44', // Use the site ID from previous steps
            name: 'A/B Test Campaign',
            type: 'sticky-bar',
            status: 'active',
            content: {
                title: 'Control: Get 10% Off',
                body: 'Use code SAVE10',
                ctaText: 'Shop Now',
                ctaUrl: '#control',
            },
            variants: [
                {
                    id: 'variant-1',
                    content: {
                        title: 'Variant 1: Get $20 Off',
                        body: 'Use code SAVE20',
                        ctaText: 'Buy Now',
                        ctaUrl: '#variant1',
                    }
                }
            ],
            position: 'bottom',
            theme: 'dark',
            displayRules: {
                frequency: 'always',
                delay: 0
            }
        });

        await campaign.save();
        console.log('Created A/B Campaign:', campaign._id);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

createABTest();
