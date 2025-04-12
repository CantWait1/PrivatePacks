"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInSchema } from "@/validation/signInSchema";
import type { z } from "zod";
import { nexaLight } from "@/fonts/fonts";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useToast } from "@/app/components/ToastProvider";
import Link from "next/link";

const SignInForm = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);

  // Redirect if already logged in
  useEffect(() => {
    if (status === "authenticated" && session) {
      console.log("Session detected, redirecting to home", session);
      router.push("/");
    }
  }, [session, status, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { showToast, ToastComponent } = useToast();

  const onSubmit = async (values: z.infer<typeof signInSchema>) => {
    if (loginAttempts >= 5) {
      showToast(
        "Too many failed attempts. Please try again later or reset your password."
      );
      return;
    }

    setIsLoading(true);

    try {
      console.log("Attempting sign in with:", values.email);
      const signInData = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      console.log("Sign in response:", signInData);

      if (signInData?.error) {
        setLoginAttempts((prev) => prev + 1);
        showToast("Invalid email or password.");
      } else {
        // Force a refresh to ensure session is updated
        router.refresh();
        router.push("/");
      }
    } catch (error) {
      console.error("Sign in error:", error);
      showToast("An error occurred during sign in.");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center ${nexaLight.className}`}
    >
      <ToastComponent />
      <form
        className="bg-neutral-800/40 border-solid border-white border-[1px] p-8 rounded-2xl shadow-lg w-full max-w-2xl space-y-6 text-white"
        onSubmit={handleSubmit(onSubmit)}
      >
        <h2 className="text-2xl text-center flex items-center justify-center">
          <Image src="/pplogo.png" width={50} height={50} alt="logo" />
          Sign In
        </h2>

        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm uppercase">
            Email
          </label>
          <input
            {...register("email")}
            type="email"
            id="email"
            className="w-full px-4 py-2 rounded-xl bg-neutral-800 border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-white"
            disabled={isLoading}
          />
          {errors.email && (
            <p className="text-red-500 text-sm font-bold">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-sm uppercase">
              Password
            </label>
            <Link
              href="/forgot-pw"
              className="text-sm text-blue-400 hover:underline"
            >
              Forgot your password?
            </Link>
          </div>
          <div className="relative">
            <input
              {...register("password")}
              type={passwordVisible ? "text" : "password"}
              id="password"
              className="w-full px-4 py-2 rounded-xl bg-neutral-800 border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-white"
              disabled={isLoading}
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
          {errors.password && (
            <p className="text-red-500 text-sm font-bold">
              {errors.password.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || loginAttempts >= 5}
          className="w-full py-2 bg-white text-black rounded-xl hover:bg-neutral-200 transition cursor-pointer disabled:opacity-70"
        >
          {isLoading ? "Signing In..." : "Sign In"}
        </button>

        <div className="text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="text-blue-400 hover:underline">
            Sign up
          </Link>
        </div>
      </form>
    </div>
  );
};

export default SignInForm;
