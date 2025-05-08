import { prisma } from "@/lib/prisma";
import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logSecurityEvent } from "@/lib/security";
import * as z from "zod";
import { rateLimitAuth } from "@/middleware/rate-limit";

// Enhanced user schema with stronger validation
const userSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username can only contain letters, numbers, underscores, and hyphens"
    ),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>\\'`~\[\]\/\-_=+])[A-Za-z\d!@#$%^&*(),.?":{}|<>\\'`~\[\]\/\-_=+]{8,}$/,
      "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ip =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "anonymous";

    // Rate limit by IP address and email (if provided)
    const requestEmail = body.email || "anonymous";
    const rateLimitResult = await rateLimitAuth(ip, requestEmail);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          message: "Too many signup attempts. Please try again later.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil(
              (rateLimitResult.reset - Date.now()) / 1000
            ).toString(),
          },
        }
      );
    }

    // Validate input
    const validationResult = userSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          user: null,
          message: "Validation failed",
          errors: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const { email, username, password } = validationResult.data;

    // Check for existing user by email (case insensitive)
    const existingUserByEmail = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
    });

    if (existingUserByEmail) {
      return NextResponse.json(
        { user: null, message: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Check for existing user by username (case insensitive)
    const existingUserByUsername = await prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: "insensitive",
        },
      },
    });

    if (existingUserByUsername) {
      return NextResponse.json(
        { user: null, message: "User with this username already exists" },
        { status: 409 }
      );
    }

    // Check if email is verified
    const emailVerification = await prisma.emailVerification.findUnique({
      where: { email },
    });

    const isVerified = emailVerification?.verified || false;

    if (!isVerified) {
      return NextResponse.json(
        {
          user: null,
          message: "Email verification is required before creating an account",
        },
        { status: 400 }
      );
    }

    // Hash password with enhanced security - dynamic import to ensure it's server-side only
    const { hashPassword } = await import("@/lib/security");
    const hashedPassword = await hashPassword(password);

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        isVerified: true, // Set isVerified to true since we've verified the email
      },
    });

    // Log successful user creation
    logSecurityEvent("USER_CREATED", { userId: newUser.id, username });

    // Remove password from response
    const { password: newUserPassword, ...rest } = newUser;

    return NextResponse.json(
      { user: rest, message: "User created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    logSecurityEvent("USER_CREATION_ERROR", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      { message: "An error occurred. Please try again later." },
      { status: 500 }
    );
  }
}

export const GET = async (req: NextRequest) => {
  const session = await getServerSession(authOptions);
  return NextResponse.json({ Authenticated: !!session });
};
