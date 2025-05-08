// app/layout.tsx

import type { Metadata } from "next";
import "./globals.css";
import Provider from "./components/Provider";
import { futura } from "@/fonts/fonts";
import PageTransition from "./components/PageTransition";
import Header from "./components/header/Header";
import BackgroundImage from "./components/Background";

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
        <BackgroundImage></BackgroundImage>
        {/* We're removing the background here as we will handle it in the Body component */}
        <div className="flex-grow">
          <Provider>
            <PageTransition>
              <Header></Header>
              <div className="mt-15">{children}</div>
            </PageTransition>
          </Provider>
        </div>
      </body>
    </html>
  );
}
