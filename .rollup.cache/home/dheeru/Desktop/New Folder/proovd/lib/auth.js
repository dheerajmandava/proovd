import CredentialsProvider from "next-auth/providers/credentials";
/**
 * Simple auth configuration for Next-Auth
 * No database adapter required
 */
export const authOptions = {
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    pages: {
        signIn: "/signin",
        error: "/signin",
    },
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!(credentials === null || credentials === void 0 ? void 0 : credentials.email) || !(credentials === null || credentials === void 0 ? void 0 : credentials.password)) {
                    return null;
                }
                // Simple credential check for development
                if (credentials.email === "admin@proovd.in" && credentials.password === "password") {
                    return {
                        id: "1",
                        name: "Admin User",
                        email: "admin@proovd.in",
                        role: "admin"
                    };
                }
                return null;
            },
        }),
    ],
    callbacks: {
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id;
                session.user.role = token.role;
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
            }
            return token;
        },
    },
};
