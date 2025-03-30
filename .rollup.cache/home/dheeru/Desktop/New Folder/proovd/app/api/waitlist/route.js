import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import { z } from 'zod';
// Define schema for email validation
const waitlistSchema = z.object({
    email: z.string().email('Please provide a valid email address'),
});
export async function POST(request) {
    try {
        // Parse the request body
        const body = await request.json();
        // Validate the request data
        const result = waitlistSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({
                success: false,
                message: 'Invalid email address'
            }, { status: 400 });
        }
        const { email } = result.data;
        // Connect to the database
        const { db } = await connectToDatabase();
        // Check if email already exists in waitlist
        const existingEntry = await db.collection('waitlist').findOne({ email });
        if (existingEntry) {
            return NextResponse.json({
                success: true,
                message: 'Email already registered on the waitlist'
            }, { status: 200 });
        }
        // Store the email in the waitlist collection
        await db.collection('waitlist').insertOne({
            email,
            createdAt: new Date(),
        });
        return NextResponse.json({
            success: true,
            message: 'Successfully joined the waitlist'
        }, { status: 201 });
    }
    catch (error) {
        console.error('Waitlist API error:', error);
        return NextResponse.json({
            success: false,
            message: 'Server error, please try again later'
        }, { status: 500 });
    }
}
