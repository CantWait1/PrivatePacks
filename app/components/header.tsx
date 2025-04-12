import React, { useState } from "react";
import Image from "next/image";
import {
  EnterIcon,
  MagnifyingGlassIcon,
  PersonIcon,
  HamburgerMenuIcon,
  Cross1Icon,
} from "@radix-ui/react-icons";
import { nexaLight } from "@/fonts/fonts";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import UserAccountNav from "./UserAccountNav";
import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

const styleIcons = "size-7";

const Header = async () => {
  const session = await getServerSession(authOptions);

  return (
    <header
      className={`flex items-center justify-between px-4 sm:px-6 md:px-10 py-5 text-xl relative z-10 ${nexaLight.className}`}
    >
      {/* Logo - always visible */}
      <div>
        <Link href="/" className="justify-center items-center flex uppercase">
          <Image src="/pplogo.png" width={30} height={30} alt="logo" />
          <p className="ml-2">Private Packs</p>
        </Link>
      </div>

      {/* Desktop Navigation - now visible at lg breakpoint instead of md */}
      <div className="hidden lg:block">
        <ul className="justify-center flex gap-6 xl:gap-10 items-center">
          <li>
            <Link
              href="/search"
              className="justify-center flex items-center gap-2 hover:text-white/80"
            >
              Search <MagnifyingGlassIcon className={styleIcons} />
            </Link>
          </li>
          <li>
            <Link
              href="/announcements"
              className="justify-center flex items-center gap-2 hover:text-white/80"
            >
              Announcements
            </Link>
          </li>
          <li>
            <Link
              href="https://discord.gg/XeJsHdPnNm"
              className="justify-center flex items-center gap-1 px-3 py-1 rounded-full hover:text-white/80"
            >
              Discord
            </Link>
          </li>
        </ul>
      </div>

      {/* Desktop Auth Section - now visible at lg breakpoint instead of md */}
      <div className="hidden lg:block">
        <ul className="justify-center flex gap-6 xl:gap-10 items-center">
          <li>
            {session?.user ? (
              <UserAccountNav />
            ) : (
              <Link
                href="/sign-in"
                className="justify-center flex items-center gap-2 hover:text-white/80"
              >
                Sign In <EnterIcon className={styleIcons} />
              </Link>
            )}
          </li>
          <li>
            {session?.user ? (
              <Link
                href="/profile"
                className="justify-center flex items-center gap-1 hover:text-white/80"
              >
                <PersonIcon className="size-6" />
                <p>{session?.user.username}</p>
              </Link>
            ) : (
              <Link href="/sign-up" className="hover:text-white/80">
                Sign Up
              </Link>
            )}
          </li>
        </ul>
      </div>

      {/* Mobile Hamburger Menu - now visible below lg breakpoint instead of md */}
      <div className="lg:hidden">
        <MobileMenu session={session} />
      </div>
    </header>
  );
};

// Mobile Menu Component using Radix Dialog
const MobileMenu = ({ session }) => {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          className="rounded-full p-2 hover:bg-white/10 transition-colors"
          aria-label="Open menu"
        >
          <HamburgerMenuIcon className="size-6" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
        <Dialog.Content
          className={`fixed top-0 right-0 h-full w-4/5 max-w-xs bg-black border-l border-white/20 p-6 shadow-xl z-50 overflow-auto ${nexaLight.className}`}
          aria-describedby="menu-description"
        >
          <Dialog.Title className="sr-only">Navigation Menu</Dialog.Title>
          <Dialog.Description id="menu-description" className="sr-only">
            Navigation links and user account options
          </Dialog.Description>

          <div className="flex justify-between items-center mb-8">
            <Link
              href="/"
              className="justify-center items-center flex uppercase"
            >
              <Image src="/pplogo.png" width={24} height={24} alt="logo" />
              <p className="ml-2 text-lg">Private Packs</p>
            </Link>
            <Dialog.Close asChild>
              <button
                className="rounded-full p-1 hover:bg-white/10 transition-colors"
                aria-label="Close menu"
              >
                <Cross1Icon className="size-6" />
              </button>
            </Dialog.Close>
          </div>

          {/* User info section at top if logged in */}
          {session?.user && (
            <div className="mb-8 pb-4 border-b border-white/20">
              <Link href="/profile" className="flex items-center gap-3">
                <PersonIcon className="size-6" />
                <p className="text-lg">{session.user.username}</p>
              </Link>
              <div className="mt-4">
                <UserAccountNav />
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="mb-8">
            <ul className="space-y-6">
              <li>
                <Link
                  href="/search"
                  className="flex items-center gap-3 text-lg hover:text-white/80"
                >
                  <MagnifyingGlassIcon className="size-5" />
                  Search
                </Link>
              </li>
              <li>
                <Link
                  href="/announcements"
                  className="flex items-center gap-3 text-lg hover:text-white/80"
                >
                  Announcements
                </Link>
              </li>
              <li>
                <Link
                  href="https://discord.gg/XeJsHdPnNm"
                  className="flex items-center gap-3 text-lg hover:text-white/80"
                >
                  Discord
                </Link>
              </li>
            </ul>
          </nav>

          {/* Auth Links (only if not logged in) */}
          {!session?.user && (
            <div className="pt-4 border-t border-white/20">
              <ul className="space-y-6">
                <li>
                  <Link
                    href="/sign-in"
                    className="flex items-center gap-3 text-lg hover:text-white/80"
                  >
                    <EnterIcon className="size-5" />
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link
                    href="/sign-up"
                    className="flex items-center gap-3 text-lg hover:text-white/80"
                  >
                    Sign Up
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default Header;
