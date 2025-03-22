import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/db';
import User from '@/app/lib/models/user';

// IMPORTANT: Remove this in production - this is for debugging only!
export async function GET() {
  try {
    await connectToDatabase();
    
    // Get all users
    const users = await User.find({}).lean();
    
    // Sanitize the result for security (mask passwords)
    const sanitizedUsers = users.map(user => {
      const sanitized = { ...user };
      
      // If password exists, mask it for security
      if (sanitized.password) {
        const pwdLength = sanitized.password.length;
        sanitized.password = `${sanitized.password.substring(0, 10)}...${sanitized.password.substring(pwdLength - 5)} (${pwdLength} chars)`;
      } else {
        sanitized.password = '[NO PASSWORD]';
      }
      
      // Convert ObjectId to string
      if (sanitized._id) {
        sanitized._id = sanitized._id.toString();
      }
      
      return sanitized;
    });
    
    return NextResponse.json({
      success: true,
      users: sanitizedUsers,
      count: sanitizedUsers.length
    });
  } catch (error) {
    console.error('Error retrieving users:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve users' },
      { status: 500 }
    );
  }
} 