import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const email = credentials.email as string;
                const password = credentials.password as string;

                const user = await db
                    .select()
                    .from(users)
                    .where(eq(users.email, email))
                    .then((res) => res[0]);

                if (!user) {
                    return null;
                }

                if (!user.isActive) {
                    throw new Error("User is inactive"); // Note: Credentials provider might not show this error to user easily in default UI
                }

                const isValid = await compare(password, user.passwordHash);

                if (!isValid) {
                    return null;
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                };
            },
        }),
    ],
    callbacks: {
        async redirect({ url, baseUrl }) {
            // Allow relative URLs and same-origin URLs
            if (url.startsWith("/")) return `${baseUrl}${url}`;
            if (url.startsWith(baseUrl)) return url;
            return baseUrl;
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id as string;
                token.role = (user as any).role || user.role || "user";
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
    },
});
