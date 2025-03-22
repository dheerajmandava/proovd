import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { v4 as uuidv4 } from "uuid"
import type { NextAuthOptions, Session } from "next-auth"
import type { JWT } from "next-auth/jwt"
import type { Account, User as AuthUser } from "next-auth"
import type { SessionStrategy } from "next-auth"
import { getServerSession } from "next-auth/next"

// Import your database connection
import { connectToDatabase } from "@/app/lib/db"
import UserModel from "@/app/lib/models/user"

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
  apiKey?: string;
  [key: string]: any;
}

// Define extended User type
interface ExtendedUser extends AuthUser {
  id?: string;
  provider?: string;
  plan?: string;
  apiKey?: string;
}

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
    newUser: '/auth/new-user'
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    Credentials({
      // Specify which fields should be submitted
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        try {
          // Validate credentials
          const { email, password } = await signInSchema.parseAsync(credentials)

          // Connect to database
          await connectToDatabase()
          
          // Find user by email - normalize to lowercase
          const normalizedEmail = email.toLowerCase().trim()
          console.log(`Attempting to authorize user: ${normalizedEmail}`)
          
          // Try to get the user with an explicit select for password and authProvider
          const user = await UserModel.findOne({ 
            email: normalizedEmail 
          }).select('+password +authProvider').lean() as UserDocument | null
          
          // User not found in database
          if (!user) {
            console.log(`No user found with email: ${normalizedEmail}`)
            throw new Error("No account found with this email")
          }
          
          console.log(`Found user: ${normalizedEmail}, Auth Provider: ${user.authProvider || 'undefined'}, Has password: ${Boolean(user.password)}`)
          
          // If user exists but has no password (social auth only)
          if (!user.password) {
            console.log(`User ${normalizedEmail} has no password (social auth user)`)
            
            // This might be an error in our database
            if (user.authProvider === 'credentials' || !user.authProvider) {
              console.log(`WARNING: User ${normalizedEmail} is marked as credentials provider but has no password!`)
              throw new Error('Account has credential provider but no password. Please use "Forgot Password".')
            }
            
            throw new Error('Please use Google to sign in to this account')
          }
          
          // Log password attempt details (but not actual values)
          console.log(`Attempting password validation for ${normalizedEmail}. Stored password hash length: ${user.password.length}`)
          
          // Verify password
          const isPasswordValid = await bcrypt.compare(
            password, 
            user.password
          )
          
          if (!isPasswordValid) {
            console.log(`Invalid password for user: ${normalizedEmail}`)
            throw new Error('Invalid password')
          }
          
          console.log(`User authenticated successfully: ${normalizedEmail}`)
          
          // Success: return user data (excluding password)
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            image: user.image,
            provider: user.authProvider || "credentials",
            plan: user.plan,
            apiKey: user.apiKey,
          }
        } catch (error: any) {
          // Log the error for debugging
          console.error('Authentication error:', error.message)
          // Pass through specific error messages for better UX
          return null
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }: { user: AuthUser; account: Account | null }) {
      try {
        await connectToDatabase()
        const email = user.email?.toLowerCase().trim()
        
        if (!email) {
          console.error("No email provided from authentication")
          return false
        }
        
        console.log(`Sign in attempt for email: ${email}, provider: ${account?.provider}`)
        
        // Check if user exists
        const existingUser = await UserModel.findOne({ email })
        
        if (existingUser) {
          console.log(`Existing user found for ${email}, updating last login time`)
          // Update last login time
          await UserModel.updateOne(
            { email }, 
            { 
              $set: { 
                lastLogin: new Date(),
                // If signing in with Google, update the user's image if it changed
                ...(account?.provider === 'google' && { image: user.image })
              } 
            }
          )
          return true
        } else {
          // Only create users for social sign-ins here
          if (account?.provider === 'google') {
            console.log(`Creating new user for ${email} via Google sign-in`)
            // Create new user for Google sign-in
            const apiKey = uuidv4()
            
            await UserModel.create({
              name: user.name || 'User',
              email,
              image: user.image,
              authProvider: 'google',
              plan: 'free',
              websites: [],
              apiKey,
              lastLogin: new Date(),
              usageStats: {
                pageviews: 0,
                lastReset: new Date(),
              },
            })
            return true
          } else {
            // This shouldn't happen as credentials sign-ups go through the register API
            console.error(`Attempt to create user with credentials through signIn callback - not allowed`)
            return false
          }
        }
      } catch (error) {
        console.error('Error in signIn callback:', error)
        return false
      }
    },
    async jwt({ token, user }: { token: JWT; user?: ExtendedUser }) {
      // Initial sign in
      if (user) {
        token.id = user.id || ''
        token.provider = user.provider
        token.plan = user.plan
        token.apiKey = user.apiKey
      }
      return token
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.id = token.id
        session.user.provider = token.provider as string
        session.user.plan = token.plan as string
        session.user.apiKey = token.apiKey as string
      }
      return session
    },
  },
  session: { strategy: "jwt" as SessionStrategy }
}

// Create and export NextAuth utilities
const handler = NextAuth(authOptions);

// Export the auth function explicitly to ensure it's correctly recognized as a function
export const auth = async () => {
  try {
    const session = await getServerSession(authOptions);
    
    // Debug logging for session access
    if (process.env.NODE_ENV === 'development') {
      if (session) {
        console.log(`Auth session accessed: user ${session.user?.id} (${session.user?.email})`);
      } else {
        console.log('Auth session accessed: No active session');
      }
    }
    
    return session;
  } catch (error) {
    console.error('Error retrieving auth session:', error);
    return null;
  }
};
export const { signIn, signOut } = handler;

// Extend the session types to include our custom fields
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      provider?: string
      plan?: string
      apiKey?: string
    }
  }

  interface User {
    id?: string
    name?: string | null
    email?: string | null
    image?: string | null
    provider?: string
    plan?: string
    apiKey?: string
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    id: string
    provider?: string
    plan?: string
    apiKey?: string
  }
} 