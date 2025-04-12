import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { db } from "./db";
import { logSecurityEvent } from "@/lib/security";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    // Set to 1 hour
    maxAge: 60 * 60,
  },
  pages: {
    signIn: "/sign-in",
    error: "/auth-error",
  },
  debug: process.env.NODE_ENV === "development", // Enable debug mode in development
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "example@example.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Import the rate limiter here to avoid circular dependencies
          const { rateLimitAuth } = await import("@/middleware/rate-limit");
          // Import verifyPassword dynamically to ensure it's only loaded on the server
          const { verifyPassword } = await import("@/lib/security");

          // Get IP from headers if available
          const ip =
            req?.headers?.["x-forwarded-for"] ||
            req?.headers?.["x-real-ip"] ||
            "auth-request";

          // Rate limit login attempts
          const rateLimitResult = await rateLimitAuth(
            typeof ip === "string"
              ? ip
              : Array.isArray(ip)
              ? ip[0]
              : "auth-request",
            credentials.email
          );

          if (!rateLimitResult.success) {
            // Log the rate limit event
            logSecurityEvent("RATE_LIMIT_EXCEEDED", {
              email: credentials.email,
              ip: ip,
            });

            // Return null to indicate auth failure
            return null;
          }

          const existingUser = await db.user.findUnique({
            where: { email: credentials.email },
          });

          if (!existingUser) {
            logSecurityEvent("FAILED_LOGIN_ATTEMPT", {
              email: credentials.email,
              reason: "User not found",
            });
            return null;
          }

          const passwordMatches = await verifyPassword(
            credentials.password,
            existingUser.password
          );

          if (!passwordMatches) {
            logSecurityEvent("FAILED_LOGIN_ATTEMPT", {
              userId: existingUser.id,
              email: existingUser.email,
              reason: "Invalid password",
            });
            return null;
          }

          // Log successful login
          logSecurityEvent("SUCCESSFUL_LOGIN", {
            userId: existingUser.id,
            email: existingUser.email,
          });

          return {
            id: `${existingUser.id}`,
            username: existingUser.username,
            email: existingUser.email,
            role: existingUser.role,
          };
        } catch (error) {
          console.error("Auth error:", error);
          logSecurityEvent("AUTH_ERROR", {
            error: error instanceof Error ? error.message : "Unknown error",
          });
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          username: user.username,
          role: user.role,
        };
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          username: token.username,
          role: token.role,
        },
      };
    },
  },
  // Add CSRF protection
  useSecureCookies: process.env.NODE_ENV === "production",
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? `__Secure-next-auth.session-token`
          : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
};

export const isAdmin = (session: any) => {
  return session?.user?.role === "ADMIN";
};
