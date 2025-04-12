"use client";

import type React from "react";

import { useState } from "react";
import { nexaLight } from "@/fonts/fonts";
import { z } from "zod";

// Email validation schema
const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = () => {
    try {
      emailSchema.parse({ email });
      setError("");
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setError(error.errors[0].message);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail()) {
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/request-password-reset", {
        method: "POST",
        body: JSON.stringify({ email }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      setMessage(data.message);
    } catch (error) {
      console.error("Failed to parse JSON response", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center text-white ${nexaLight.className}`}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-neutral-800/40 border-solid border-white border-[1px] p-8 rounded-2xl shadow-lg w-full max-w-md space-y-6"
      >
        <h2 className="text-2xl text-center">Forgot Password</h2>

        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm uppercase">
            Email
          </label>
          <input
            type="email"
            id="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 rounded-xl bg-neutral-800 border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-white"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 bg-white text-black rounded-xl hover:bg-neutral-200 transition cursor-pointer disabled:opacity-70"
        >
          {isLoading ? "Sending..." : "Send Reset Link"}
        </button>

        {message && (
          <p className="text-green-400 text-sm font-bold text-center">
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
