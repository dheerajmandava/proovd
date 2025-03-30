import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createUser, getUserByEmail } from '@/app/lib/services';
import { handleApiError } from '@/app/lib/utils/error';
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
        // Normalize email (lowercase, trim)
        const normalizedEmail = email.toLowerCase().trim();
        // Check if user already exists
        const existingUser = await getUserByEmail(normalizedEmail);
        if (existingUser) {
            console.log(`Registration attempted for existing user: ${normalizedEmail}`);
            return NextResponse.json({
                success: false,
                message: 'Email already in use'
            }, { status: 409 });
        }
        // Hash the password with appropriate cost factor
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);
        console.log(`Generated hashed password for ${normalizedEmail} (length: ${hashedPassword.length})`);
        try {
            // Create new user using the service
            const newUser = await createUser({
                name: name.trim(),
                email: normalizedEmail,
                password: hashedPassword,
                authProvider: 'credentials'
            });
            console.log(`User created successfully with ID: ${newUser._id}`);
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
            const apiError = handleApiError(error);
            // Return a user-friendly error message
            return NextResponse.json({
                success: false,
                message: error.code === 11000
                    ? 'Email already in use'
                    : apiError.message
            }, { status: apiError.statusCode });
        }
    }
    catch (error) {
        console.error('Registration error:', error);
        const apiError = handleApiError(error);
        // Return a user-friendly error message
        return NextResponse.json({
            success: false,
            message: error.code === 11000
                ? 'Email already in use'
                : apiError.message
        }, { status: apiError.statusCode });
    }
}
