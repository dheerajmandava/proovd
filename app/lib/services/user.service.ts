import { connectToDatabase, mongoose } from '../database/connection';
import { cache } from 'react';
import User from '../models/user';

type UserType = {
  _id: string;
  name: string;
  email: string;
  image?: string;
  role: string;
  plan: string;
  lastLogin: Date;
  emailNotifications: boolean;
  notificationDigest: string;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Get a user by ID with cached results for server components
 * @param id User ID
 * @returns User data or null if not found
 */
export const getUserById = cache(async (id: string): Promise<UserType | null> => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return null;
  
  await connectToDatabase();
  const user = await User.findById(id).lean();
  return user as UserType;
});

/**
 * Get a user by email with cached results for server components
 * @param email User email
 * @returns User data or null if not found
 */
export const getUserByEmail = cache(async (email: string): Promise<UserType | null> => {
  if (!email) return null;
  
  await connectToDatabase();
  const user = await User.findOne({ email: email.toLowerCase() }).lean();
  return user as UserType;
});

/**
 * Get a user by API key
 * @param apiKey API key
 * @returns User data or null if not found
 */
export async function getUserByApiKey(apiKey: string): Promise<UserType | null> {
  if (!apiKey) return null;
  
  await connectToDatabase();
  const user = await User.findOne({ apiKey }).lean();
  return user as UserType;
}

/**
 * Create a new user
 * @param userData User data to create
 * @returns Created user
 */
export async function createUser(userData: {
  name: string;
  email: string;
  password?: string;
  image?: string;
  authProvider?: string;
}): Promise<UserType> {
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
  return user.toObject() as UserType;
}

/**
 * Update user data
 * @param id User ID
 * @param updateData Data to update
 * @returns Updated user
 */
export async function updateUser(
  id: string, 
  updateData: Partial<UserType>
): Promise<UserType | null> {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return null;
  
  await connectToDatabase();
  
  // Remove _id from update data if present
  if (updateData._id) {
    delete updateData._id;
  }
  
  const user = await User.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true }
  ).lean();
  
  return user as UserType;
}

/**
 * Update user preferences
 * @param id User ID
 * @param preferences Preferences to update
 * @returns Updated user
 */
export async function updateUserPreferences(
  id: string,
  preferences: {
    emailNotifications?: boolean;
    notificationDigest?: string;
  }
): Promise<UserType | null> {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return null;
  
  await connectToDatabase();
  
  const updateData: Record<string, any> = {};
  
  if (typeof preferences.emailNotifications === 'boolean') {
    updateData.emailNotifications = preferences.emailNotifications;
  }
  
  if (preferences.notificationDigest && 
      ['realtime', 'daily', 'weekly'].includes(preferences.notificationDigest)) {
    updateData.notificationDigest = preferences.notificationDigest;
  }
  
  const user = await User.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true }
  ).lean();
  
  return user as UserType;
}

/**
 * Update user last login time
 * @param id User ID
 * @returns Updated user
 */
export async function updateUserLastLogin(id: string): Promise<UserType | null> {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return null;
  
  await connectToDatabase();
  
  const user = await User.findByIdAndUpdate(
    id,
    { $set: { lastLogin: new Date() } },
    { new: true }
  ).lean();
  
  return user as UserType;
}

/**
 * Delete a user
 * @param id User ID
 * @returns True if deleted, false if not found
 */
export async function deleteUser(id: string): Promise<boolean> {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return false;
  
  await connectToDatabase();
  const result = await User.deleteOne({ _id: id });
  return result.deletedCount > 0;
}

/**
 * Generate API key for user
 * @returns Random API key
 */
function generateApiKey(): string {
  const crypto = require('crypto');
  return `pk_${crypto.randomBytes(16).toString('hex')}`;
}

/**
 * Get all users (admin/debug only)
 * @returns Array of all users
 */
export async function getAllUsers(): Promise<any[]> {
  await connectToDatabase();
  const users = await User.find({}).lean();
  return users;
}

/**
 * Get a user with authentication data (including password field)
 * @param email User email
 * @returns User data with password or null if not found
 */
export async function getUserWithAuthData(email: string): Promise<any> {
  if (!email) return null;
  
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
export async function updateUserProfile(
  id: string,
  profileData: {
    name?: string;
    image?: string;
  }
): Promise<UserType | null> {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return null;
  
  await connectToDatabase();
  
  const updateData: Record<string, any> = {};
  
  if (profileData.name) {
    updateData.name = profileData.name;
  }
  
  if (profileData.image !== undefined) {
    updateData.image = profileData.image;
  }
  
  const user = await User.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true }
  ).lean();
  
  return user as UserType;
} 