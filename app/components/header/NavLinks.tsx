"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";

const NavLinks = () => {
  const pathname = usePathname();

  const links = [
    {
      href: "/search",
      label: "Packs",
      icon: <MagnifyingGlassIcon className="size-4" />,
    },
    { href: "/announcements", label: "Announcements", icon: null },
    { href: "https://discord.gg/XeJsHdPnNm", label: "Discord", icon: null },
  ];

  return (
    <ul className="flex items-center space-x-1">
      {links.map((link) => (
        <li key={link.href}>
          <Link
            href={link.href}
            className={`relative px-4 py-2 rounded-full flex items-center space-x-1.5 transition-all
                      ${
                        pathname === link.href
                          ? "bg-white/10 text-white"
                          : "hover:bg-white/5 text-white/80 hover:text-white"
                      }`}
          >
            {link.icon && <span>{link.icon}</span>}
            <span>{link.label}</span>
            {pathname === link.href && (
              <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/3 h-0.5 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full" />
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
};

export default NavLinks;
