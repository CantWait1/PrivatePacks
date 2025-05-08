import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { passwordSchema, logSecurityEvent } from "@/lib/security";
import { z } from "zod";
import { rateLimitPasswordReset } from "@/middleware/rate-limit";

// Input validation schema
const resetSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: passwordSchema,
});

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "anonymous";

    // Rate limit password reset attempts
    const rateLimitResult = await rateLimitPasswordReset(ip, "token-reset");

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          message: "Too many password reset attempts. Please try again later.",
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
    const body = await req.json();
    const result = resetSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: result.error.format() },
        { status: 400 }
      );
    }

    const { token, password } = result.data;

    // Find the token in the database
    const passwordResetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!passwordResetToken) {
      logSecurityEvent("INVALID_RESET_TOKEN", { token: "***" });
      return NextResponse.json(
        { message: "Invalid or expired token" },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (passwordResetToken.expires < new Date()) {
      // Delete expired token
      await prisma.passwordResetToken.delete({
        where: { id: passwordResetToken.id },
      });

      logSecurityEvent("EXPIRED_RESET_TOKEN", {
        userId: passwordResetToken.userId,
      });
      return NextResponse.json(
        {
          message:
            "Token has expired. Please request a new password reset link.",
        },
        { status: 400 }
      );
    }

    // Hash the new password - dynamic import to ensure it's server-side only
    const { hashPassword } = await import("@/lib/security");
    const hashedPassword = await hashPassword(password);

    // Update the user's password
    await prisma.user.update({
      where: { id: passwordResetToken.userId },
      data: { password: hashedPassword },
    });

    // Delete the used token
    await prisma.passwordResetToken.delete({
      where: { id: passwordResetToken.id },
    });

    // Log the successful password reset
    logSecurityEvent("PASSWORD_RESET_SUCCESS", {
      userId: passwordResetToken.userId,
    });

    return NextResponse.json(
      { message: "Password reset successfully. Redirecting to login..." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error resetting password:", error);
    logSecurityEvent("PASSWORD_RESET_ERROR", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      { message: "An error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
