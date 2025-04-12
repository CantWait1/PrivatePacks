"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { nexaLight } from "@/fonts/fonts";
import { z } from "zod";
import { passwordSchema } from "@/lib/security";

// Password validation schema
const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid password reset link");
    }
  }, [token]);

  const validateForm = () => {
    try {
      resetPasswordSchema.parse({ password, confirmPassword });
      setValidationErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path) {
            errors[err.path[0]] = err.message;
          }
        });
        setValidationErrors(errors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to reset password");
        return;
      }

      setMessage(data.message || "Password reset successfully");

      setTimeout(() => {
        router.push("/sign-in");
      }, 2000);
    } catch (error) {
      setError("An error occurred. Please try again.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center text-white ${nexaLight.className}`}
    >
      <div className="bg-neutral-800/40 border-solid border-white border-[1px] p-8 rounded-2xl shadow-lg w-full max-w-md space-y-6">
        <h2 className="text-2xl text-center">Reset Your Password</h2>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-300 p-3 rounded-xl text-center">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-900/50 border border-green-500 text-green-300 p-3 rounded-xl text-center">
            {message}
          </div>
        )}

        {!error && !message && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm uppercase">
                New Password
              </label>
              <div className="relative">
                <input
                  type={passwordVisible ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-neutral-800 border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-white"
                  placeholder="Enter your new password"
                  required
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
              {validationErrors.password && (
                <p className="text-red-400 text-sm">
                  {validationErrors.password}
                </p>
              )}
              <p className="text-gray-400 text-xs mt-1">
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
              <input
                type={passwordVisible ? "text" : "password"}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-neutral-800 border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-white"
                placeholder="Confirm your new password"
                required
              />
              {validationErrors.confirmPassword && (
                <p className="text-red-400 text-sm">
                  {validationErrors.confirmPassword}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 bg-white text-black rounded-xl hover:bg-neutral-200 transition disabled:opacity-70 cursor-pointer"
            >
              {isLoading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
