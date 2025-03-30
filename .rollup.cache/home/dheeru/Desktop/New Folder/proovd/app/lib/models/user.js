import mongoose, { Schema } from 'mongoose';
// Define the retry mechanism for database operations
const withRetry = async (operation, maxRetries = 3) => {
    let lastError = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            // Add debug logging
            console.log(`MongoDB operation attempt ${attempt}/${maxRetries}`);
            const result = await operation();
            console.log(`MongoDB operation successful on attempt ${attempt}`);
            return result;
        }
        catch (error) {
            lastError = error;
            console.error(`MongoDB operation failed on attempt ${attempt}/${maxRetries}:`, error);
            // Don't wait on the last attempt
            if (attempt < maxRetries) {
                // Exponential backoff: 100ms, 200ms, 400ms, etc.
                const delay = Math.min(100 * Math.pow(2, attempt - 1), 2000);
                console.log(`Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    throw lastError;
};
// Define the User schema
const UserSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String }, // Optional for OAuth users but REQUIRED for credential users
    image: { type: String },
    authProvider: { type: String, enum: ['credentials', 'google'], default: 'credentials' },
    role: { type: String, default: 'user' },
    lastLogin: { type: Date, default: Date.now },
    plan: {
        type: String,
        required: true,
        enum: ['free', 'starter', 'growth', 'business'],
        default: 'free'
    },
    websites: [{
            domain: { type: String, required: true },
            settings: {
                position: {
                    type: String,
                    enum: ['bottom-left', 'bottom-right', 'top-left', 'top-right'],
                    default: 'bottom-left'
                },
                delay: { type: Number, default: 5 },
                displayDuration: { type: Number, default: 5 },
                maxNotifications: { type: Number, default: 5 },
                theme: { type: String, default: 'light' }
            }
        }],
    apiKey: { type: String, required: true, unique: true },
    usageStats: {
        pageviews: { type: Number, default: 0 },
        lastReset: { type: Date, default: Date.now }
    },
    emailNotifications: { type: Boolean, default: true },
    notificationDigest: {
        type: String,
        enum: ['realtime', 'daily', 'weekly'],
        default: 'daily'
    }
}, { timestamps: true });
// Add retry methods to the schema
UserSchema.statics.findOneWithRetry = function (filter) {
    return withRetry(() => this.findOne(filter));
};
UserSchema.statics.findByIdWithRetry = function (id) {
    return withRetry(() => this.findById(id));
};
UserSchema.statics.updateOneWithRetry = function (filter, update) {
    return withRetry(() => this.updateOne(filter, update));
};
// Check if the model exists before creating it
const User = (mongoose.models.User || mongoose.model('User', UserSchema));
export default User;
