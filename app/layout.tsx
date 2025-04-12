import type React from "react";
// app/layout.tsx

import type { Metadata } from "next";
import "./globals.css";
import Provider from "./components/Provider";
import { futura } from "@/fonts/fonts";
import PageTransition from "./components/PageTransition";

// Updated to use Metadata API instead of next/head
export const metadata: Metadata = {
  title: "Private Packs",
  description: "The official site for exclusive packs!",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${futura.className} relative min-h-screen flex flex-col bg-black`}
      >
        <div className="absolute inset-0 -z-10 h-full w-full items-center px-5 py-24 bg-[radial-gradient(125%_125%_at_50%_10%,#000_40%,#00061a_100%)] bg-no-repeat bg-cover [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_600%)]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]"></div>
        </div>
        <div className="flex-grow">
          <Provider>
            <PageTransition>{children}</PageTransition>
          </Provider>
        </div>
      </body>
    </html>
  );
}
