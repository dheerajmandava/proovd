import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { connectToDatabase } from '@/app/lib/database/connection';
import User from '@/app/lib/models/user';
import { z } from 'zod';
// Define the validation schema for registration
const registerSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email format"),
    password: z.string()
        .min(8, "Password must be at least 8 characters long")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number")
});
export async function POST(request) {
    var _a;
    console.log('Registration API called');
    try {
        // Parse the request body
        const body = await request.json();
        console.log('Received registration data:', Object.assign(Object.assign({}, body), { password: body.password ? '********' : undefined }));
        // Validate the input data
        const result = registerSchema.safeParse(body);
        if (!result.success) {
            console.log('Registration validation failed:', result.error.errors);
            return NextResponse.json({ success: false, message: result.error.errors[0].message }, { status: 400 });
        }
        // Destructure validated data
        const { name, email, password } = result.data;
        console.log('Validated registration data for:', email);
        // Connect to database
        try {
            await connectToDatabase();
            console.log('Connected to database for registration');
        }
        catch (dbError) {
            console.error('Database connection error during registration:', dbError);
            return NextResponse.json({ success: false, message: 'Unable to connect to database. Please try again later.' }, { status: 500 });
        }
        // Normalize email (lowercase, trim)
        const normalizedEmail = email.toLowerCase().trim();
        // Check if user already exists
        const existingUser = await User.findOne({ email: normalizedEmail }).select('+authProvider');
        if (existingUser) {
            console.log(`Registration attempted for existing user: ${normalizedEmail}, auth provider: ${existingUser.authProvider || 'unknown'}`);
            if (existingUser.authProvider === 'google') {
                return NextResponse.json({
                    success: false,
                    message: 'This email is already registered using Google. Please sign in with Google.',
                    provider: 'google'
                }, { status: 409 });
            }
            return NextResponse.json({
                success: false,
                message: 'Email already in use'
            }, { status: 409 });
        }
        // Hash the password with appropriate cost factor
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);
        console.log(`Generated hashed password for ${normalizedEmail} (length: ${hashedPassword.length})`);
        // Generate API key
        const apiKey = uuidv4();
        try {
            // Create new user with explicit authProvider and password fields
            const userData = {
                name: name.trim(),
                email: normalizedEmail,
                password: hashedPassword,
                authProvider: 'credentials',
                apiKey,
                plan: 'free',
                lastLogin: new Date(),
                websites: [],
                usageStats: {
                    pageviews: 0,
                    lastReset: new Date()
                }
            };
            console.log('Attempting to create user with data:', Object.assign(Object.assign({}, userData), { password: hashedPassword ? `[Hashed: ${hashedPassword.substring(0, 10)}...]` : undefined }));
            // Create the user directly with the User.create method
            const newUser = await User.create(userData);
            console.log(`User created successfully with ID: ${newUser._id}`);
            // Verify the user was saved with password by fetching it fresh from DB
            // IMPORTANT: Use .select('+password +authProvider') to include fields with select: false
            const savedUser = await User.findById(newUser._id).select('+password +authProvider');
            console.log(`User verification - ID: ${savedUser === null || savedUser === void 0 ? void 0 : savedUser._id}`);
            console.log(`User verification - Email: ${savedUser === null || savedUser === void 0 ? void 0 : savedUser.email}`);
            console.log(`User verification - Auth Provider: ${savedUser === null || savedUser === void 0 ? void 0 : savedUser.authProvider}`);
            console.log(`User verification - Has password: ${Boolean(savedUser === null || savedUser === void 0 ? void 0 : savedUser.password)}`);
            console.log(`User verification - Password length: ${((_a = savedUser === null || savedUser === void 0 ? void 0 : savedUser.password) === null || _a === void 0 ? void 0 : _a.length) || 0}`);
            // Return success response without sensitive data
            return NextResponse.json({
                success: true,
                message: 'Registration successful',
                user: {
                    id: newUser._id.toString(),
                    name: newUser.name,
                    email: newUser.email
                }
            }, { status: 201 });
        }
        catch (error) {
            console.error('Error saving new user:', error);
            // Return a user-friendly error message
            return NextResponse.json({
                success: false,
                message: error.code === 11000
                    ? 'Email already in use'
                    : 'Registration failed. Please try again later.'
            }, { status: 500 });
        }
    }
    catch (error) {
        console.error('Registration error:', error);
        // Return a user-friendly error message
        return NextResponse.json({
            success: false,
            message: error.code === 11000
                ? 'Email already in use'
                : 'Registration failed. Please try again later.'
        }, { status: 500 });
    }
}
