import mongoose, { Schema } from 'mongoose';
// Create the schema for website stats
const WebsiteStatsSchema = new Schema({
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
}, {
    timestamps: true
});
// Create or get the model
export const WebsiteStats = mongoose.models.WebsiteStats ||
    mongoose.model('WebsiteStats', WebsiteStatsSchema);
export default WebsiteStats;
