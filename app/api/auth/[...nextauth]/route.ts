import NextAuth from "next-auth"
import { authOptions } from "@/auth"

// The simplest possible implementation that is guaranteed to work
const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }

// Add OPTIONS method for CORS support
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
} 