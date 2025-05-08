import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";
import { z } from "zod";
import {
  generatePasswordResetToken,
  logSecurityEvent,
  sanitizeInput,
} from "@/lib/security";
import { rateLimitPasswordReset } from "@/middleware/rate-limit";

// Input validation schema
const requestSchema = z.object({
  email: z.string().email("Invalid email address"),
});

interface EmailParams {
  to: string;
  subject: string;
  text: string;
  html: string;
}

async function sendEmail({ to, subject, text, html }: EmailParams) {
  try {
    console.log("Attempting to send email to:", to);

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      secure: true, // Use TLS
    });

    await transporter.verify();

    const info = await transporter.sendMail({
      from: `"Security Team" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log("Email sent successfully:", info.messageId);
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    logSecurityEvent("EMAIL_SEND_FAILURE", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw new Error(
      `Email sending failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Validate input
    const body = await req.json();
    const result = requestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    const { email } = result.data;
    const ip =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "anonymous";

    // Rate limit password reset requests
    const rateLimitResult = await rateLimitPasswordReset(ip, email);

    if (!rateLimitResult.success) {
      // Use the same message as successful requests to prevent email enumeration
      return NextResponse.json(
        {
          message:
            "If an account exists with that email, a password reset link has been sent.",
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

    // Always use the same response time regardless of whether the user exists
    // This prevents timing attacks that could reveal if an email exists
    const startTime = Date.now();

    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      // Generate a secure token
      const { token, expires } = generatePasswordResetToken();

      // Store the token in the database
      await prisma.passwordResetToken.upsert({
        where: { userId: user.id },
        update: { token, expires },
        create: { userId: user.id, token, expires },
      });

      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      const resetLink = `${baseUrl}/reset-password?token=${token}`;

      // Send a more secure email with both text and HTML versions
      await sendEmail({
        to: email,
        subject: "Reset your password",
        text: `You requested a password reset. Click the link to reset your password: ${resetLink}\n\nIf you didn't request this, please ignore this email or contact support if you're concerned.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset Request</h2>
            <p>You requested a password reset. Click the button below to reset your password:</p>
            <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p>${resetLink}</p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email or contact support if you're concerned.</p>
          </div>
        `,
      });

      // Log the event
      logSecurityEvent("PASSWORD_RESET_REQUESTED", {
        userId: user.id,
        email: sanitizeInput(email),
      });
    }

    // Simulate consistent response time to prevent timing attacks
    const elapsedTime = Date.now() - startTime;
    const minResponseTime = 500; // minimum 500ms response time

    if (elapsedTime < minResponseTime) {
      await new Promise((resolve) =>
        setTimeout(resolve, minResponseTime - elapsedTime)
      );
    }

    // Always return the same message whether the user exists or not
    return NextResponse.json({
      message:
        "If an account exists with that email, a password reset link has been sent.",
    });
  } catch (error: any) {
    console.error("💥 API ERROR:", error);
    logSecurityEvent("PASSWORD_RESET_ERROR", {
      error: error.message || "Unknown error",
    });

    return NextResponse.json(
      { message: "An error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
