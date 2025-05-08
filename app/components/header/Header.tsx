"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { EnterIcon, PersonIcon } from "@radix-ui/react-icons";
import { nexaLight } from "@/fonts/fonts";
import Link from "next/link";
import { useSession } from "next-auth/react";
import UserAccountNav from "../UserAccountNav";
import MobileMenu from "./MobileMenu";
import NavLinks from "./NavLinks";

const Header = () => {
  const { data: session, status } = useSession();
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Show header when scrolling up, hide when scrolling down
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down & past initial 100px
        setVisible(false);
      } else {
        // Scrolling up or at the top
        setVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <header
      className={`${
        nexaLight.className
      } w-full top-0 z-50 transition-transform duration-300 ${
        visible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      {/* Blurred background */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md border-b border-white/10" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        {/* Logo with simple blue outline */}
        <Link
          href="/"
          className="group flex items-center space-x-2 hover:opacity-90 transition-opacity"
        >
          <div className="relative overflow-hidden rounded-full">
            <Image
              src="/pplogo.png"
              width={32}
              height={32}
              alt="Private Packs logo"
              className="rounded-full"
            />
          </div>
          <span className="text-xl font-medium text-white uppercase">
            Private Packs
          </span>
        </Link>

        {/* Desktop Navigation - Central and prominent */}
        <nav className="hidden lg:flex items-center justify-center">
          <div className="bg-white/5 backdrop-blur-sm rounded-full border border-white/10 px-1 py-1">
            <NavLinks />
          </div>
        </nav>

        {/* Auth Section */}
        <div className="hidden lg:flex items-center space-x-6">
          {session ? (
            <div className="flex items-center space-x-4">
              <Link
                href="/profile"
                className="group flex items-center space-x-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
              >
                <div className="bg-blue-500 p-1 rounded-full">
                  <PersonIcon className="size-4 text-white" />
                </div>
                <span className="text-white/90 group-hover:text-white transition-colors">
                  {session.user.username}
                </span>
              </Link>
              <UserAccountNav />
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link
                href="/sign-in"
                className="flex items-center space-x-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
              >
                <EnterIcon className="size-4" />
                <span>Sign In</span>
              </Link>
              <Link
                href="/sign-up"
                className="px-4 py-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-all"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Menu */}
        <div className="lg:hidden">
          <MobileMenu />
        </div>
      </div>
    </header>
  );
};

export default Header;
