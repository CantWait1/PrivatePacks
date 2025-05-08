"use client";
import React from "react";
import { signOut } from "next-auth/react";

const UserAccountNav = () => {
  return (
    <button
      onClick={() =>
        signOut({
          redirect: true,
          callbackUrl: `${window.location.origin}/sign-in`,
        })
      }
      className="justify-center flex items-center gap-2 cursor-pointer hover:text-white/80"
    >
      Sign Out
    </button>
  );
};

export default UserAccountNav;
