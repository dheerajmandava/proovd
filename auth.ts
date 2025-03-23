import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import bcrypt from "bcryptjs"
import { z } from "zod"
import type { NextAuthOptions, Session } from "next-auth"
import type { JWT } from "next-auth/jwt"
import type { Account, User as AuthUser } from "next-auth"
import type { SessionStrategy } from "next-auth"
import { getServerSession } from "next-auth/next"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import { connectToDatabase } from "@/app/lib/db"
import User from "@/app/lib/models/user"
import { MongoClient } from "mongodb"
import { AuthOptions } from "next-auth"
import { secret } from '@aws-amplify/backend'
// Define the validation schema for sign-in credentials
const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

// Define UserDocument type for Mongoose compatibility
interface UserDocument {
  _id: string;
  name: string;
  email: string;
  password?: string;
  image?: string;
  authProvider?: string;
  plan?: string;
  [key: string]: any;
}

// MongoDB connection for the adapter
let clientPromise: Promise<MongoClient>;

// Initialize MongoDB client once
try {
  const { client } = await connectToDatabase();
  clientPromise = Promise.resolve(client);
} catch (error) {
  console.error("Failed to establish MongoDB connection for Auth:", error);
  throw error;
}

// Extend the built-in Session and User types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string;
      role: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    image?: string;
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name: string;
    image?: string;
    role: string;
  }
}

// Configure auth options
export const authOptions: AuthOptions = {
  // Use MongoDB as storage
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
        if (!credentials?.email || !credentials?.password) {
          console.log("Email or password missing");
          return null;
        }
        
        console.log("Attempting to authorize user:", credentials.email);
        
        try {
          await connectToDatabase();
          
          // Find user by email
          const user = await User.findOne({ email: credentials.email });
          
          if (!user) {
            console.log("User not found:", credentials.email);
            return null;
          }
          
          console.log("Found user:", credentials.email, "Auth Provider:", user.provider, "Has password:", !!user.password);
          
          // For users created via credentials, check password
          if (!user.password) {
            console.log("User has no password set:", credentials.email);
            return null;
          }
          
          // Validate password
          console.log("Attempting password validation for", credentials.email, "Stored password hash length:", user.password.length);
          const passwordIsValid = await bcrypt.compare(
            credentials.password,
            user.password
          );
          
          if (!passwordIsValid) {
            console.log("Invalid password for user:", credentials.email);
            return null;
          }
          
          console.log("User authenticated successfully:", credentials.email);
          
          // Update last login time
          await User.updateOne(
            { _id: user._id },
            { $set: { lastLogin: new Date() } }
          );
          
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name || user.email.split("@")[0],
            image: user.image || null,
            role: user.role || "user",
          };
        } catch (error) {
          console.error("Auth error:", error);
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
  secret: secret('NEXTAUTH_SECRET').toString(),  
  
  // Configure debug mode
  debug: process.env.NODE_ENV === "development",
  
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
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      
      return session;
    },
    
    // Only allow specific sign-in methods for specific providers
    async signIn({ user, account, profile, email, credentials }) {
      console.log("Sign in attempt for email:", user.email, "provider:", account?.provider);
      try {
        await connectToDatabase();
        
        // Check if user already exists
        const existingUser = await User.findOne({ email: user.email });
        
        if (existingUser) {
          console.log("Existing user found for", user.email, ", updating last login time");
          
          // Update existing user's last login time
          await User.updateOne(
            { _id: existingUser._id },
            { $set: { lastLogin: new Date() } }
          );
          
          // Pass the ID from the database to the JWT
          user.id = existingUser._id.toString();
          return true;
        }
        
        // Only allow sign-in with existing users
        console.log("User not found, credential sign-in only works with registered users");
        return false;
      } catch (error) {
        console.error("Error during signIn callback:", error);
        return false;
      }
    },
  },
};

// Export the configured auth
export const auth = async () => await getServerSession(authOptions);

// For edge compatibility
export default NextAuth(authOptions); 