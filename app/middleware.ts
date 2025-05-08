import { type NextRequest, NextResponse } from "next/server";
import { rateLimitMiddleware } from "@/middleware/rate-limit";

// Define paths that need rate limiting
const AUTH_PATHS = [
  "/api/user",
  "/api/auth/callback/credentials",
  "/api/request-password-reset",
  "/api/reset-password",
];

// Security headers with updated CSP to allow Discord CDN
const securityHeaders = {
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://cdn.discordapp.com; font-src 'self' data:; connect-src 'self' https://discord.com;",
  "X-XSS-Protection": "1; mode=block",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
};

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Skip auth middleware for NextAuth paths to prevent interference with sessions
  if (path.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Apply rate limiting to auth endpoints
  if (AUTH_PATHS.some((authPath) => path.startsWith(authPath))) {
    // Stricter rate limiting for auth endpoints
    const authRateLimiter = rateLimitMiddleware({
      limit: 5,
      window: 60, // 5 requests per minute
      identifier: (req) => {
        // Use combination of IP and user agent for better identification
        const ip =
          req.headers.get("x-forwarded-for") ||
          req.headers.get("x-real-ip") ||
          "anonymous";
        const userAgent = req.headers.get("user-agent") || "unknown";
        return `${ip}:${userAgent.substring(0, 50)}`;
      },
    });

    const rateLimitResponse = await authRateLimiter(request);

    // If rate limit response is returned, add security headers to it
    if (rateLimitResponse) {
      Object.entries(securityHeaders).forEach(([key, value]) => {
        rateLimitResponse.headers.set(key, value);
      });
      return rateLimitResponse;
    }
  }

  // Apply security headers to all responses
  const response = NextResponse.next();

  // Add security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

export const config = {
  matcher: [
    // Apply middleware to all API routes and auth pages
    // Exclude NextAuth callback and session endpoints to prevent interference
    "/api/:path*",
    "/sign-in",
    "/sign-up",
    "/reset-password",
    "/forgot-pw",
  ],
};
