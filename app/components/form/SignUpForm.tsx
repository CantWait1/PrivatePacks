"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { nexaLight } from "@/fonts/fonts";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { passwordSchema } from "@/lib/security";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

// Step 1: Email verification
const emailSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email"),
});

// Step 2: Verification code
const verificationSchema = z.object({
  code: z.string().length(6, "Verification code must be 6 digits"),
});

// Step 3: Complete registration
const registrationSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username must be less than 30 characters")
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        "Username can only contain letters, numbers, underscores, and hyphens"
      ),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type EmailFormData = z.infer<typeof emailSchema>;
type VerificationFormData = z.infer<typeof verificationSchema>;
type RegistrationFormData = z.infer<typeof registrationSchema>;

const SignUpForm = () => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);

  // Email form
  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: emailErrors },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  // Verification form
  const {
    register: registerVerification,
    handleSubmit: handleSubmitVerification,
    formState: { errors: verificationErrors },
  } = useForm<VerificationFormData>({
    resolver: zodResolver(verificationSchema),
  });

  // Registration form
  const {
    register: registerRegistration,
    handleSubmit: handleSubmitRegistration,
    formState: { errors: registrationErrors },
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
  });

  const onSubmitEmail = async (data: EmailFormData) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to send verification code");
      }

      setEmail(data.email);
      setSuccess("Verification code sent to your email. CHECK SPAM FOLDER!");

      // Move to next step after a short delay
      setTimeout(() => {
        setStep(2);
        setSuccess(null);
      }, 1500);
    } catch (error) {
      console.error("Error sending verification code:", error);
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  const onSubmitVerification = async (data: VerificationFormData) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/auth/verify-email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: data.code }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to verify email");
      }

      setSuccess("Email verified successfully");

      // Move to next step after a short delay
      setTimeout(() => {
        setStep(3);
        setSuccess(null);
      }, 1500);
    } catch (error) {
      console.error("Error verifying email:", error);
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  const onSubmitRegistration = async (data: RegistrationFormData) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          username: data.username,
          password: data.password,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create account");
      }

      setSuccess("Account created successfully! Redirecting to login...");

      // Redirect to login page after a short delay
      setTimeout(() => {
        router.push("/sign-in");
      }, 2000);
    } catch (error) {
      console.error("Error creating account:", error);
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  const resendVerificationCode = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.error || "Failed to resend verification code"
        );
      }

      setSuccess("Verification code resent to your email");
    } catch (error) {
      console.error("Error resending verification code:", error);
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center ${nexaLight.className}`}
    >
      <div className="bg-neutral-800/40 border-solid border-white border-[1px] p-8 rounded-2xl shadow-lg w-full max-w-md space-y-6 text-white">
        <div className="text-center">
          <Image
            src="/pplogo.png"
            width={50}
            height={50}
            alt="logo"
            className="mx-auto mb-2"
          />
          <h2 className="text-2xl font-bold">Create an Account</h2>
          <p className="text-gray-400 mt-2">Step {step} of 3</p>
        </div>

        {error && (
          <Alert variant="destructive" className="bg-red-900/50 border-red-800">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-900/50 border-green-800">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {step === 1 && (
          <form
            onSubmit={handleSubmitEmail(onSubmitEmail)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm uppercase">
                Email
              </label>
              <Input
                {...registerEmail("email")}
                id="email"
                type="email"
                placeholder="Enter your email"
                className="bg-neutral-800 border-neutral-700 focus:ring-white"
                disabled={loading}
              />
              {emailErrors.email && (
                <p className="text-red-500 text-sm">
                  {emailErrors.email.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-white text-black hover:bg-neutral-200"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Verification Code"
              )}
            </Button>

            <p className="text-center text-sm text-gray-400">
              Already have an account?{" "}
              <Link href="/sign-in" className="text-blue-400 hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        )}

        {step === 2 && (
          <form
            onSubmit={handleSubmitVerification(onSubmitVerification)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <label htmlFor="code" className="block text-sm uppercase">
                Verification Code
              </label>
              <Input
                {...registerVerification("code")}
                id="code"
                type="text"
                placeholder="Enter 6-digit code"
                className="bg-neutral-800 border-neutral-700 focus:ring-white text-center text-xl tracking-widest"
                maxLength={6}
                disabled={loading}
              />
              {verificationErrors.code && (
                <p className="text-red-500 text-sm">
                  {verificationErrors.code.message}
                </p>
              )}
            </div>

            <div className="text-center text-sm text-gray-400">
              <p>We sent a verification code to</p>
              <p className="font-medium text-white">{email}</p>
            </div>

            <Button
              type="submit"
              className="w-full bg-white text-black hover:bg-neutral-200"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Email"
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={resendVerificationCode}
                className="text-blue-400 hover:underline text-sm"
                disabled={loading}
              >
                Resend code
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-gray-400 hover:underline text-sm"
                disabled={loading}
              >
                Use a different email
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form
            onSubmit={handleSubmitRegistration(onSubmitRegistration)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm uppercase">
                Username
              </label>
              <Input
                {...registerRegistration("username")}
                id="username"
                type="text"
                placeholder="Choose a username"
                className="bg-neutral-800 border-neutral-700 focus:ring-white"
                disabled={loading}
              />
              {registrationErrors.username && (
                <p className="text-red-500 text-sm">
                  {registrationErrors.username.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm uppercase">
                Password
              </label>
              <div className="relative">
                <Input
                  {...registerRegistration("password")}
                  id="password"
                  type={passwordVisible ? "text" : "password"}
                  placeholder="Create a password"
                  className="bg-neutral-800 border-neutral-700 focus:ring-white"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm"
                >
                  {passwordVisible ? (
                    <span className="text-gray-400">Hide</span>
                  ) : (
                    <span className="text-gray-400">Show</span>
                  )}
                </button>
              </div>
              {registrationErrors.password && (
                <p className="text-red-500 text-sm">
                  {registrationErrors.password.message}
                </p>
              )}
              <p className="text-xs text-gray-400">
                Password must be at least 8 characters and include uppercase,
                lowercase, number, and special character.
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="confirmPassword"
                className="block text-sm uppercase"
              >
                Confirm Password
              </label>
              <Input
                {...registerRegistration("confirmPassword")}
                id="confirmPassword"
                type={passwordVisible ? "text" : "password"}
                placeholder="Confirm your password"
                className="bg-neutral-800 border-neutral-700 focus:ring-white"
                disabled={loading}
              />
              {registrationErrors.confirmPassword && (
                <p className="text-red-500 text-sm">
                  {registrationErrors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-white text-black hover:bg-neutral-200"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default SignUpForm;
