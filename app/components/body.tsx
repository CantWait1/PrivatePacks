"use client";

import React from "react";
import Search from "./search_enhanced";
import { nura } from "@/fonts/fonts";
import { nexaLight } from "@/fonts/fonts";
import { nexaHeavy } from "@/fonts/fonts";
import { futura } from "@/fonts/fonts";
import { CaretDownIcon, BorderSolidIcon } from "@radix-ui/react-icons";
import TextEffectSpeed from "./TextEffectSpeed";
import { GlowEffectButton } from "./GlowEffectButton";
import "../globals.css";
import { AnimatedNumberInView } from "./AnimatedCount";
import Link from "next/link";

const Body = () => {
  return (
    <div className="w-full overflow-x-hidden">
      <div
        className={`${futura.className} py-16 md:py-24 lg:py-32 justify-center flex flex-col items-center px-4`}
      >
        <div className="flex justify-center items-center">
          <TextEffectSpeed
            className={`text-4xl sm:text-5xl md:text-7xl lg:text-9xl uppercase outlined-text ${nexaLight.className}`}
            text="Private Packs"
          />
        </div>

        <div>
          <TextEffectSpeed
            className={`text-xl sm:text-2xl md:text-3xl lg:text-4xl ${nexaHeavy.className} mt-4 md:mt-6 lg:mt-10 text-center`}
            text="The official site for exclusive packs!"
          />
        </div>

        <div>
          <AnimatedNumberInView />
        </div>

        <div className="mt-10 sm:mt-16 md:mt-24 lg:mt-40 flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 md:gap-8 lg:gap-10 w-full">
          <Link
            href="https://discord.gg/XeJsHdPnNm"
            className="w-full sm:w-auto"
          >
            <GlowEffectButton
              className={`w-full sm:w-auto px-6 md:px-10 lg:px-20 py-3 md:py-4 lg:py-6 !text-base md:!text-xl lg:!text-2xl !rounded-md !cursor-pointer hover:-translate-y-2 transition duration-300 uppercase border-x-solid border-x-[#1b1530] border-x-[1px] ${nexaLight.className}`}
              text={`Join Our Discord`}
            />
          </Link>
          <Link href="/announcements" className="w-full sm:w-auto">
            <GlowEffectButton
              className={`w-full sm:w-auto px-6 md:px-10 lg:px-20 py-3 md:py-4 lg:py-6 !text-base md:!text-xl lg:!text-2xl !rounded-md !cursor-pointer hover:-translate-y-2 transition duration-300 uppercase border-x-solid border-x-[#1b1530] border-x-[1px] ${nexaLight.className}`}
              text="New And Upcoming"
            />
          </Link>
          <Link href="/sign-up" className="w-full sm:w-auto">
            <GlowEffectButton
              className={`w-full sm:w-auto px-6 md:px-10 lg:px-20 py-3 md:py-4 lg:py-6 !text-base md:!text-xl lg:!text-2xl !rounded-md !cursor-pointer hover:-translate-y-2 transition duration-300 uppercase border-x-solid border-x-[#1b1530] border-x-[1px] ${nexaLight.className}`}
              text="Make An Account"
            />
          </Link>
        </div>

        <Link
          href="/search"
          className="mt-8 sm:mt-12 md:mt-16 lg:mt-20 w-full sm:w-auto flex justify-center"
        >
          <GlowEffectButton
            className={`w-full sm:w-auto px-8 sm:px-16 md:px-24 lg:px-30 py-4 sm:py-6 md:py-10 lg:py-15 !text-2xl md:!text-3xl lg:!text-5xl !bg-black !text-white !cursor-pointer hover:scale-105 transition duration-300 uppercase font-extrabold !rounded-xl ${nexaHeavy.className}`}
            text="Browse Our Packs"
          />
        </Link>

        <Link href="#mid" aria-label="Scroll down">
          <CaretDownIcon className="size-8 md:size-12 lg:size-16 xl:size-30 hover:bg-white/10 mt-8 md:mt-12 lg:mt-20 rounded-full hover:translate-y-3 duration-300 transition cursor-pointer" />
        </Link>
      </div>

      <div
        className="flex flex-col px-4 sm:px-6 md:px-8 lg:px-16 py-16 md:py-24 lg:py-32 mt-20 md:mt-40 lg:mt-60"
        id="mid"
      >
        <div className="flex flex-col lg:flex-row justify-center items-center gap-8 md:gap-12 lg:gap-20">
          <div className="flex flex-col w-full lg:w-[45%] gap-6">
            <h1
              className={`${nexaHeavy.className} text-4xl sm:text-5xl md:text-6xl lg:text-8xl mb-4 md:mb-6 lg:mb-10 text-center lg:text-left lg:ml-10`}
            >
              General Info
            </h1>

            <div className="bg-black/30 backdrop-blur-sm p-6 md:p-8 lg:p-10 rounded-2xl shadow-lg shadow-black/20">
              <h2
                className={`${nexaLight.className} text-3xl md:text-4xl lg:text-6xl mb-3 md:mb-4 lg:mb-5`}
              >
                Security & Privacy
              </h2>
              <h3
                className={`text-lg md:text-xl lg:text-2xl ${nexaLight.className} text-justify`}
              >
                As a community, we are committed to protecting your privacy at
                all times. Whether it concerns information you provide on our
                website or files you choose to download, we will never endanger
                your personal data. We do not track, sell, or share any private
                information, and we strictly uphold the principles of digital
                safety and confidentiality. Your trust means everything to us,
                and we will always work to maintain a safe, respectful
                environment for everyone -{" "}
                <span className="font-bold">Andrew & The Staff Team. </span>
                See our{" "}
                <Link href="/PPandTOS" className="underline text-blue-300">
                  Privacy Policy and Terms Of Service
                </Link>{" "}
                for more info.
              </h3>
            </div>

            <div className="bg-black/30 backdrop-blur-sm p-6 md:p-8 lg:p-10 rounded-2xl shadow-lg shadow-black/20">
              <h2
                className={`${nexaLight.className} text-3xl md:text-4xl lg:text-6xl mb-3 md:mb-4 lg:mb-5`}
              >
                Owners and Development
              </h2>
              <h3
                className={`text-lg md:text-xl lg:text-2xl ${nexaLight.className} text-justify`}
              >
                The community is managed by{" "}
                <span className="font-extrabold text-blue-400 bg-black/40 px-2 rounded-md">
                  Benni
                </span>{" "}
                and{" "}
                <span className="font-extrabold text-purple-300 bg-black/40 px-2 rounded-md">
                  Ebonics
                </span>
                , who take care of everything behind the scenes. They handle the
                planning, organization, and make sure everything runs smoothly.
                All technical and development work is done by{" "}
                <span className="font-extrabold text-teal-500 bg-black/40 px-2 rounded-md">
                  Andrew
                </span>
                . He makes sure the platform works well, fixes any problems, and
                adds new features when needed. The team is small but effective,
                with each person focusing on their own tasks. Together, they
                keep everything running in a clear and professional way.
              </h3>
            </div>
          </div>

          <div className="w-full lg:w-[45%] mt-8 lg:mt-0 flex justify-center">
            <div className="relative w-full max-w-[900px] rounded-2xl overflow-hidden shadow-2xl shadow-black/30 group transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-b from-[#5865F2]/20 to-[#2A2D3E]/80 pointer-events-none z-10 opacity-60 group-hover:opacity-40 transition-opacity duration-300"></div>
              <div className="absolute inset-0 border-2 border-[#5865F2]/40 rounded-2xl z-20 pointer-events-none group-hover:border-[#5865F2]/60 transition-all duration-300"></div>
              <div className="absolute top-0 left-0 right-0 bg-[#1a1b26]/80 backdrop-blur-sm flex items-center px-4 py-3 z-30">
                <svg
                  className="h-6 w-6 text-[#5865F2] mr-2"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 127.14 96.36"
                  fill="currentColor"
                >
                  <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
                </svg>
                <span
                  className={`${nexaHeavy.className} text-lg md:text-xl text-white`}
                >
                  Private Packs Community
                </span>
              </div>

              <div className="w-full pt-12">
                {" "}
                <iframe
                  src="https://discord.com/widget?id=1143265402449842227&theme=dark"
                  width="100%"
                  height="600"
                  frameBorder="0"
                  sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
                  className="rounded-b-2xl"
                  style={{
                    height: "calc(100vh - 400px)",
                    minHeight: "450px",
                    maxHeight: "800px",
                  }}
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-[#5865F2]/30 to-transparent"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Body;
