// components/TransitionLink.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";
import { motion } from "framer-motion";

interface TransitionLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function TransitionLink({
  href,
  children,
  className = "",
  onClick,
}: TransitionLinkProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    // Animate out
    document.body.classList.add("page-transitioning");

    // Execute any onClick handler passed to the component
    if (onClick) onClick();

    // Navigate after animation finishes
    setTimeout(() => {
      router.push(href);
      document.body.classList.remove("page-transitioning");
    }, 300); // Match this timing with your CSS transition
  };

  return (
    <Link href={href} onClick={handleClick} className={className}>
      {children}
    </Link>
  );
}
