import { type NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

// Initialize Redis client for rate limiting
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

type RateLimitOptions = {
  limit: number;
  window: number; // in seconds
  identifier?: (req: NextRequest) => string;
};

export async function rateLimit(
  req: NextRequest,
  options: RateLimitOptions = { limit: 5, window: 60 }
) {
  const identifier =
    options.identifier?.(req) ||
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "anonymous";

  const key = `rate-limit:${identifier}:${req.nextUrl.pathname}`;

  // Get current count
  const count = await redis.get<number>(key);

  // Set initial count if not exists
  if (count === null) {
    await redis.set(key, 1, { ex: options.window });
    return {
      success: true,
      limit: options.limit,
      remaining: options.limit - 1,
    };
  }

  // Increment count
  if (count < options.limit) {
    await redis.incr(key);
    return {
      success: true,
      limit: options.limit,
      remaining: options.limit - (count + 1),
    };
  }

  return {
    success: false,
    limit: options.limit,
    remaining: 0,
  };
}

export function rateLimitMiddleware(
  options: RateLimitOptions = { limit: 5, window: 60 }
) {
  return async function middleware(req: NextRequest) {
    try {
      const result = await rateLimit(req, options);

      if (!result.success) {
        return NextResponse.json(
          { message: "Too many requests, please try again later." },
          {
            status: 429,
            headers: {
              "Retry-After": options.window.toString(),
              "X-RateLimit-Limit": options.limit.toString(),
              "X-RateLimit-Remaining": "0",
            },
          }
        );
      }

      // If successful, let the request continue
      // The middleware chain will continue
      return NextResponse.next({
        headers: {
          "X-RateLimit-Limit": options.limit.toString(),
          "X-RateLimit-Remaining": result.remaining.toString(),
        },
      });
    } catch (error) {
      console.error("Rate limiting error:", error);
      // In case of error, allow the request to proceed
      return NextResponse.next();
    }
  };
}

// Export the standalone functions for use in API routes
export const DEFAULT_WINDOW_SIZE = 60; // 60 seconds
export const DEFAULT_MAX_REQUESTS = 5; // 5 requests per window

/**
 * Helper function to rate limit authentication attempts
 * Uses stricter limits for auth endpoints
 */
export async function rateLimitAuth(ip: string, username: string) {
  const identifier = `auth-rate-limit:${username}:${ip}`;

  try {
    const requests = (await redis.get<number>(identifier)) || 0;

    if (requests >= DEFAULT_MAX_REQUESTS) {
      const ttl = await redis.ttl(identifier);
      return {
        success: false,
        limit: DEFAULT_MAX_REQUESTS,
        remaining: 0,
        reset: Date.now() + ttl * 1000,
      };
    }

    if (requests === 0) {
      await redis.set(identifier, 1, { ex: DEFAULT_WINDOW_SIZE });
    } else {
      await redis.incr(identifier);
    }

    const ttl = await redis.ttl(identifier);
    const remaining = Math.max(0, DEFAULT_MAX_REQUESTS - (requests + 1));

    return {
      success: true,
      limit: DEFAULT_MAX_REQUESTS,
      remaining,
      reset: Date.now() + ttl * 1000,
    };
  } catch (error) {
    console.error("Rate limiting error:", error);

    // Log the error but allow the request to proceed in case of Redis failure
    return {
      success: true,
      limit: DEFAULT_MAX_REQUESTS,
      remaining: DEFAULT_MAX_REQUESTS - 1,
      reset: Date.now() + DEFAULT_WINDOW_SIZE * 1000,
    };
  }
}

/**
 * Helper function to rate limit password reset attempts
 * Uses stricter limits and longer window for password resets
 */
export async function rateLimitPasswordReset(ip: string, email: string) {
  const identifier = `pwd-reset-rate-limit:${email}:${ip}`;
  const WINDOW_SIZE = 300; // 5 minutes
  const MAX_REQUESTS = 3;

  try {
    const requests = (await redis.get<number>(identifier)) || 0;

    if (requests >= MAX_REQUESTS) {
      const ttl = await redis.ttl(identifier);
      return {
        success: false,
        limit: MAX_REQUESTS,
        remaining: 0,
        reset: Date.now() + ttl * 1000,
      };
    }

    if (requests === 0) {
      await redis.set(identifier, 1, { ex: WINDOW_SIZE });
    } else {
      await redis.incr(identifier);
    }

    const ttl = await redis.ttl(identifier);
    const remaining = Math.max(0, MAX_REQUESTS - (requests + 1));

    return {
      success: true,
      limit: MAX_REQUESTS,
      remaining,
      reset: Date.now() + ttl * 1000,
    };
  } catch (error) {
    console.error("Rate limiting error:", error);

    return {
      success: true,
      limit: MAX_REQUESTS,
      remaining: MAX_REQUESTS - 1,
      reset: Date.now() + WINDOW_SIZE * 1000,
    };
  }
}
