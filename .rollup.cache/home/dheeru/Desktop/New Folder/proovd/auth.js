import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { getUserWithAuthData, updateUserLastLogin } from "@/app/lib/services/user.service";
import { connectToDatabase, withDatabaseConnection } from "@/app/lib/database/connection";
import { MongoClient } from "mongodb";
// Define the validation schema for sign-in credentials
const signInSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});
// Create a MongoDB client
const mongoClient = new MongoClient(process.env.MONGODB_URI || "", {
    maxPoolSize: 50, // Match the pool size in connection.ts
    connectTimeoutMS: 30000,
    socketTimeoutMS: 60000,
    serverSelectionTimeoutMS: 30000,
});
// Client promise
const clientPromise = mongoClient.connect()
    .then(client => {
    console.log("Connected MongoDB client for Next Auth");
    return client;
})
    .catch(err => {
    console.error("MongoDB client connection error:", err);
    throw err;
});
// Ensure the main database connection is also established
connectToDatabase().catch(error => {
    console.error("Failed to connect to MongoDB:", error);
});
// Wrap user service calls with retry logic for better reliability
const getUserWithRetry = async (email) => {
    return withDatabaseConnection(async () => {
        return await getUserWithAuthData(email);
    });
};
const updateUserLoginWithRetry = async (userId) => {
    return withDatabaseConnection(async () => {
        return await updateUserLastLogin(userId);
    });
};
// Configure auth options
export const authOptions = {
    // Use standard MongoDBAdapter with separate client
    adapter: MongoDBAdapter(clientPromise, {
        databaseName: process.env.MONGODB_DB || "proovd",
    }),
    // Configure auth providers
    providers: [
        Credentials({
            id: "credentials",
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!(credentials === null || credentials === void 0 ? void 0 : credentials.email) || !(credentials === null || credentials === void 0 ? void 0 : credentials.password)) {
                    console.log("Email or password missing");
                    return null;
                }
                console.log("Attempting to authorize user:", credentials.email);
                try {
                    // Ensure database is connected before proceeding
                    await connectToDatabase();
                    // Get the user with password from the database using the service with retry
                    const user = await getUserWithRetry(credentials.email);
                    if (!user) {
                        console.log("User not found:", credentials.email);
                        return null;
                    }
                    console.log("Found user:", credentials.email, "Auth Provider:", user.authProvider, "Has password:", !!user.password);
                    // For users created via credentials, check password
                    if (!user.password) {
                        console.log("User has no password set:", credentials.email);
                        return null;
                    }
                    // Validate password
                    console.log("Attempting password validation for", credentials.email, "Stored password hash length:", user.password.length);
                    const passwordIsValid = await bcrypt.compare(credentials.password, user.password);
                    if (!passwordIsValid) {
                        console.log("Invalid password for user:", credentials.email);
                        return null;
                    }
                    console.log("User authenticated successfully:", credentials.email);
                    // Update last login time using the service with retry
                    await updateUserLoginWithRetry(user._id.toString());
                    return {
                        id: user._id.toString(),
                        email: user.email,
                        name: user.name || user.email.split("@")[0],
                        image: user.image || null,
                        role: user.role || "user",
                    };
                }
                catch (error) {
                    console.error("Auth error:", error);
                    // Attempt to reconnect for future requests
                    try {
                        console.log("Attempting to reconnect database for future auth requests...");
                        connectToDatabase().catch(err => console.error("Reconnection attempt failed:", err));
                    }
                    catch (reconnectError) {
                        console.error("Failed to initiate reconnection:", reconnectError);
                    }
                    return null;
                }
            },
        }),
    ],
    // Configure session strategy
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    // Secret for encrypting cookies
    secret: process.env.NEXTAUTH_SECRET,
    // Configure pages
    pages: {
        signIn: "/auth/signin",
        signOut: "/auth/signout",
        error: "/auth/error",
    },
    callbacks: {
        // Callback when creating a JWT token
        async jwt({ token, user, trigger, session }) {
            // Initial sign-in
            if (user) {
                console.log("JWT callback - user is defined");
                token.id = user.id;
                token.role = user.role || "user";
            }
            // Session update
            if (trigger === "update" && session) {
                console.log("JWT callback - session update", session);
                if (session.user) {
                    token.name = session.user.name;
                }
            }
            return token;
        },
        // Callback when creating a session
        async session({ session, token }) {
            if (session.user && token) {
                session.user.id = token.id;
                session.user.role = token.role;
            }
            return session;
        },
        // Only allow specific sign-in methods for specific providers
        async signIn({ user, account, profile, email, credentials }) {
            console.log("Sign in attempt for email:", user.email, "provider:", account === null || account === void 0 ? void 0 : account.provider);
            try {
                // Ensure database is connected
                await connectToDatabase();
                // Get user from database using service with retry
                const existingUser = await getUserWithRetry(user.email);
                if (existingUser) {
                    console.log("Existing user found for", user.email, ", updating last login time");
                    // Update existing user's last login time using service with retry
                    await updateUserLoginWithRetry(existingUser._id.toString());
                    // Pass the ID from the database to the JWT
                    user.id = existingUser._id.toString();
                    return true;
                }
                // Only allow sign-in with existing users
                console.log("User not found, credential sign-in only works with registered users");
                return false;
            }
            catch (error) {
                console.error("Error during signIn callback:", error);
                // Attempt to reconnect for future requests
                try {
                    console.log("Attempting to reconnect database after signIn error...");
                    connectToDatabase().catch(err => console.error("Reconnection attempt failed:", err));
                }
                catch (reconnectError) {
                    console.error("Failed to initiate reconnection:", reconnectError);
                }
                return false;
            }
        },
    },
    // Add debug mode in non-production environments
    debug: process.env.NODE_ENV !== 'production',
};
// Export the configured auth with improved error handling
export const auth = async () => {
    try {
        // Ensure database is connected before getting the session
        await connectToDatabase();
        return await getServerSession(authOptions);
    }
    catch (error) {
        console.error("Error in auth function:", error);
        // Return null session on error to prevent cascading failures
        return null;
    }
};
// For edge compatibility
export default NextAuth(authOptions);
