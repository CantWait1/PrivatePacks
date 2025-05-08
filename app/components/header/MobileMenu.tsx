"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react"; // Add this import
import {
  EnterIcon,
  PersonIcon,
  Cross1Icon,
  MagnifyingGlassIcon,
} from "@radix-ui/react-icons";
import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { nexaLight } from "@/fonts/fonts";
import UserAccountNav from "../UserAccountNav";

// Remove the session prop, we'll get it from useSession hook
const MobileMenu = () => {
  const pathname = usePathname();
  const { data: session } = useSession(); // Use the useSession hook

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
          aria-label="Open menu"
        >
          <svg
            width="20"
            height="14"
            viewBox="0 0 20 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1 1H19M1 7H19M1 13H19"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-md z-40" />
        <motion.div
          className="fixed inset-0 z-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
        <Dialog.Content
          className={`fixed top-0 right-0 h-full w-4/5 max-w-xs bg-black/90 backdrop-blur-md border-l border-white/10 p-6 shadow-xl z-50 overflow-auto ${nexaLight.className}`}
        >
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="absolute inset-0"
            style={{ pointerEvents: "none" }}
          />
          <Dialog.Title className="sr-only">
            Mobile Navigation Menu
          </Dialog.Title>
          <div className="flex justify-between items-center mb-8">
            <Link href="/" className="flex items-center space-x-2">
              <div className="relative overflow-hidden rounded-full">
                <Image
                  src="/pplogo.png"
                  width={24}
                  height={24}
                  alt="logo"
                  className="rounded-full"
                />
              </div>
              <span className="text-lg text-white uppercase">
                Private Packs
              </span>
            </Link>
            <Dialog.Close asChild>
              <button
                className="rounded-full p-2 bg-white/5 hover:bg-white/10 transition-colors"
                aria-label="Close menu"
              >
                <Cross1Icon className="size-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* User info section at top if logged in */}
          {session?.user && (
            <div className="mb-8 pb-4 border-b border-white/10">
              <Link
                href="/profile"
                className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="bg-blue-500 p-1.5 rounded-full">
                  <PersonIcon className="size-5 text-white" />
                </div>
                <p className="text-lg">{session.user.username}</p>
              </Link>
              <div className="mt-4 px-1">
                <UserAccountNav />
              </div>
            </div>
          )}

          {/* Rest of the component remains the same... */}
          {/* Navigation Links */}
          <nav className="mb-8">
            <div className="text-sm uppercase text-white/50 mb-2 px-2">
              Navigation
            </div>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/search"
                  className={`flex items-center gap-3 p-3 rounded-lg text-lg transition-colors
                    ${
                      pathname === "/search"
                        ? "bg-white/10"
                        : "hover:bg-white/5"
                    }`}
                >
                  <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5">
                    <MagnifyingGlassIcon className="size-5" />
                  </div>
                  Packs
                </Link>
              </li>
              <li>
                <Link
                  href="/announcements"
                  className={`flex items-center gap-3 p-3 rounded-lg text-lg transition-colors
                    ${
                      pathname === "/announcements"
                        ? "bg-white/10"
                        : "hover:bg-white/5"
                    }`}
                >
                  <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 8V12L14 14M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  Announcements
                </Link>
              </li>
              <li>
                <Link
                  href="https://discord.gg/XeJsHdPnNm"
                  className="flex items-center gap-3 p-3 rounded-lg text-lg hover:bg-white/5 transition-colors"
                >
                  <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M9 11.5C9 12.3284 8.32843 13 7.5 13C6.67157 13 6 12.3284 6 11.5C6 10.6716 6.67157 10 7.5 10C8.32843 10 9 10.6716 9 11.5Z"
                        fill="white"
                      />
                      <path
                        d="M16.5 13C17.3284 13 18 12.3284 18 11.5C18 10.6716 17.3284 10 16.5 10C15.6716 10 15 10.6716 15 11.5C15 12.3284 15.6716 13 16.5 13Z"
                        fill="white"
                      />
                      <path
                        d="M18.25 4H5.75C4.23122 4 3 5.23122 3 6.75V17.25C3 18.7688 4.23122 20 5.75 20H15.25L14.75 18L16 19.25L17.1667 20.4167L19.5 22.5V6.75C19.5 5.23122 18.2688 4 16.75 4H18.25ZM14.0833 15.6667C14.0833 15.6667 13.7083 15.2083 13.4167 14.8333C14.9167 14.4583 15.5 13.5833 15.5 13.5833C15.0286 13.8569 14.5786 14.0703 14.0833 14.25C13.3806 14.5269 12.6694 14.7686 11.9167 14.9167C10.4167 15.25 9.08333 15.1667 8 14.9167C7.21053 14.7251 6.45007 14.442 5.75 14.0833C5.39874 13.9037 5.06952 13.688 4.75833 13.4167C4.70833 13.3833 4.66667 13.3667 4.625 13.3333C4.60417 13.3167 4.59167 13.3083 4.58333 13.3C4.38333 13.1833 4.27083 13.0833 4.27083 13.0833C4.27083 13.0833 4.83333 13.9333 6.29167 14.3167C6 14.6833 5.61667 15.1667 5.61667 15.1667C3.91667 15.1167 3.16667 13.8833 3.16667 13.8833C3.16667 10.5167 4.625 7.79167 4.625 7.79167C6.08333 6.70833 7.45833 6.75 7.45833 6.75L7.58333 6.89167C6.18333 7.29167 5.525 7.90833 5.525 7.90833C5.525 7.90833 5.725 7.79167 6.06667 7.65C7.15833 7.20833 7.44167 7.125 7.80833 7.08333C7.89167 7.06667 7.95833 7.05833 8.04167 7.05833C8.65007 6.98037 9.26651 6.97811 9.875 7.05C10.6703 7.16267 11.4393 7.42751 12.1458 7.83333C12.1458 7.83333 11.5208 7.25 10.1875 6.85C10.1875 6.85 10.2917 6.72917 10.5208 6.75C10.5208 6.75 11.9167 6.70833 13.375 7.79167C13.375 7.79167 14.8333 10.5167 14.8333 13.8833C14.8333 13.8833 14.0833 15.1167 12.3833 15.1667L14.0833 15.6667Z"
                        fill="white"
                      />
                    </svg>
                  </div>
                  Discord
                </Link>
              </li>
            </ul>
          </nav>

          {/* Auth Links (only if not logged in) */}
          {!session?.user && (
            <div className="pt-4 border-t border-white/10">
              <div className="text-sm uppercase text-white/50 mb-3 px-2">
                Account
              </div>
              <div className="space-y-3">
                <Link
                  href="/sign-in"
                  className="flex items-center justify-center gap-2 w-full p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <EnterIcon className="size-5" />
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="flex items-center justify-center w-full p-3 rounded-lg bg-blue-500 hover:bg-blue-600 transition-all"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default MobileMenu;
