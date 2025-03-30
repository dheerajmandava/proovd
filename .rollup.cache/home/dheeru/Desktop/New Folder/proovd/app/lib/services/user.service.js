import { connectToDatabase, mongoose } from '../database/connection';
import { cache } from 'react';
import User from '../models/user';
/**
 * Get a user by ID with cached results for server components
 * @param id User ID
 * @returns User data or null if not found
 */
export const getUserById = cache(async (id) => {
    if (!id || !mongoose.Types.ObjectId.isValid(id))
        return null;
    await connectToDatabase();
    const user = await User.findById(id).lean();
    return user;
});
/**
 * Get a user by email with cached results for server components
 * @param email User email
 * @returns User data or null if not found
 */
export const getUserByEmail = cache(async (email) => {
    if (!email)
        return null;
    await connectToDatabase();
    const user = await User.findOne({ email: email.toLowerCase() }).lean();
    return user;
});
/**
 * Get a user by API key
 * @param apiKey API key
 * @returns User data or null if not found
 */
export async function getUserByApiKey(apiKey) {
    if (!apiKey)
        return null;
    await connectToDatabase();
    const user = await User.findOne({ apiKey }).lean();
    return user;
}
/**
 * Create a new user
 * @param userData User data to create
 * @returns Created user
 */
export async function createUser(userData) {
    await connectToDatabase();
    const user = new User({
        name: userData.name,
        email: userData.email.toLowerCase(),
        password: userData.password,
        image: userData.image,
        authProvider: userData.authProvider || 'credentials',
        role: 'user',
        plan: 'free',
        lastLogin: new Date(),
        emailNotifications: true,
        notificationDigest: 'daily',
        apiKey: generateApiKey()
    });
    await user.save();
    return user.toObject();
}
/**
 * Update user data
 * @param id User ID
 * @param updateData Data to update
 * @returns Updated user
 */
export async function updateUser(id, updateData) {
    if (!id || !mongoose.Types.ObjectId.isValid(id))
        return null;
    await connectToDatabase();
    // Remove _id from update data if present
    if (updateData._id) {
        delete updateData._id;
    }
    const user = await User.findByIdAndUpdate(id, { $set: updateData }, { new: true }).lean();
    return user;
}
/**
 * Update user preferences
 * @param id User ID
 * @param preferences Preferences to update
 * @returns Updated user
 */
export async function updateUserPreferences(id, preferences) {
    if (!id || !mongoose.Types.ObjectId.isValid(id))
        return null;
    await connectToDatabase();
    const updateData = {};
    if (typeof preferences.emailNotifications === 'boolean') {
        updateData.emailNotifications = preferences.emailNotifications;
    }
    if (preferences.notificationDigest &&
        ['realtime', 'daily', 'weekly'].includes(preferences.notificationDigest)) {
        updateData.notificationDigest = preferences.notificationDigest;
    }
    const user = await User.findByIdAndUpdate(id, { $set: updateData }, { new: true }).lean();
    return user;
}
/**
 * Update user last login time
 * @param id User ID
 * @returns Updated user
 */
export async function updateUserLastLogin(id) {
    if (!id || !mongoose.Types.ObjectId.isValid(id))
        return null;
    await connectToDatabase();
    const user = await User.findByIdAndUpdate(id, { $set: { lastLogin: new Date() } }, { new: true }).lean();
    return user;
}
/**
 * Delete a user
 * @param id User ID
 * @returns True if deleted, false if not found
 */
export async function deleteUser(id) {
    if (!id || !mongoose.Types.ObjectId.isValid(id))
        return false;
    await connectToDatabase();
    const result = await User.deleteOne({ _id: id });
    return result.deletedCount > 0;
}
/**
 * Generate API key for user
 * @returns Random API key
 */
function generateApiKey() {
    const crypto = require('crypto');
    return `pk_${crypto.randomBytes(16).toString('hex')}`;
}
/**
 * Get all users (admin/debug only)
 * @returns Array of all users
 */
export async function getAllUsers() {
    await connectToDatabase();
    const users = await User.find({}).lean();
    return users;
}
/**
 * Get a user with authentication data (including password field)
 * @param email User email
 * @returns User data with password or null if not found
 */
export async function getUserWithAuthData(email) {
    if (!email)
        return null;
    await connectToDatabase();
    // Use lean() to get a plain JavaScript object instead of a Mongoose document
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password').lean();
    return user;
}
/**
 * Update user profile data
 * @param id User ID
 * @param profileData Profile data to update
 * @returns Updated user
 */
export async function updateUserProfile(id, profileData) {
    if (!id || !mongoose.Types.ObjectId.isValid(id))
        return null;
    await connectToDatabase();
    const updateData = {};
    if (profileData.name) {
        updateData.name = profileData.name;
    }
    if (profileData.image !== undefined) {
        updateData.image = profileData.image;
    }
    const user = await User.findByIdAndUpdate(id, { $set: updateData }, { new: true }).lean();
    return user;
}
