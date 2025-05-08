"use client";

import React, { useEffect, useState } from "react";
import { nexaLight, nexaHeavy, futura, zendotsRegular } from "@/fonts/fonts";
import { CaretDownIcon, BorderSolidIcon } from "@radix-ui/react-icons";
import TextEffectSpeed from "./TextEffectSpeed";
import { GlowEffectButton } from "./GlowEffectButton";
import "../globals.css";
import { AnimatedNumberInView } from "./AnimatedCount";
import Link from "next/link";
import { motion } from "framer-motion";
import BackgroundImage from "./Background";

// Dark theme grid lines
const DarkGrid = () => {
  return (
    <div className="fixed inset-0 w-full h-full -z-5 dark-grid">
      <div className="h-full w-full bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:30px_30px]"></div>
    </div>
  );
};

const Body = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
        duration: 0.5,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1.0] },
    },
  };

  const buttonVariants = {
    hover: {
      scale: 1.05,
      y: -8,
      boxShadow: "0 10px 20px rgba(255, 255, 255, 0.1)",
      transition: { duration: 0.3 },
    },
    tap: { scale: 0.95 },
  };

  return (
    <div className="w-full overflow-x-hidden">
      <BackgroundImage />
      <DarkGrid />

      {/* Hero Section */}
      <motion.div
        initial="hidden"
        animate={isLoaded ? "visible" : "hidden"}
        variants={containerVariants}
        className={`${futura.className} py-16 md:py-24 lg:py-32 justify-center flex flex-col items-center px-4 relative`}
      >
        {/* Animated highlight/glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl max-h-96 bg-gray-900/50 blur-3xl rounded-full animate-pulse-slow"></div>

        <motion.div
          variants={itemVariants}
          className="flex justify-center items-center relative"
        >
          <div className="glitch-wrapper">
            <TextEffectSpeed
              className={`text-3xl sm:text-4xl md:text-6xl lg:text-8xl uppercase dark-outline ${zendotsRegular.className}`}
              text="Private Packs"
            />
          </div>
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent animate-pulse-slow"></div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <TextEffectSpeed
            className={`text-xl sm:text-2xl md:text-3xl lg:text-4xl ${nexaHeavy.className} mt-4 md:mt-6 lg:mt-10 text-center text-glow-dark`}
            text="The official site for exclusive packs!"
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <AnimatedNumberInView />
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="mt-10 sm:mt-16 md:mt-24 lg:mt-40 flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 md:gap-8 lg:gap-10 w-full"
        >
          <Link
            href="https://discord.gg/XeJsHdPnNm"
            className="w-full sm:w-auto"
          >
            <motion.div
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <GlowEffectButton
                className={`dark-button w-full sm:w-auto px-6 md:px-10 lg:px-20 py-3 md:py-4 lg:py-6 !text-base md:!text-xl lg:!text-2xl !cursor-pointer uppercase border-solid border-gray-800 border-[1px] ${nexaLight.className}`}
                text={`Join Our Discord`}
              />
            </motion.div>
          </Link>

          <Link href="/announcements" className="w-full sm:w-auto">
            <motion.div
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <GlowEffectButton
                className={`dark-button w-full sm:w-auto px-6 md:px-10 lg:px-20 py-3 md:py-4 lg:py-6 !text-base md:!text-xl lg:!text-2xl !cursor-pointer uppercase border-solid border-gray-800 border-[1px] ${nexaLight.className}`}
                text="New And Upcoming"
              />
            </motion.div>
          </Link>

          <Link href="/sign-up" className="w-full sm:w-auto">
            <motion.div
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <GlowEffectButton
                className={`dark-button w-full sm:w-auto px-6 md:px-10 lg:px-20 py-3 md:py-4 lg:py-6 !text-base md:!text-xl lg:!text-2xl !cursor-pointer uppercase border-solid border-gray-800 border-[1px] ${nexaLight.className}`}
                text="Make An Account"
              />
            </motion.div>
          </Link>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Link
            href="/search"
            className="mt-8 sm:mt-12 md:mt-16 lg:mt-20 w-full sm:w-auto flex justify-center"
          >
            <motion.div
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <GlowEffectButton
                className={`primary-dark-button w-full sm:w-auto px-8 sm:px-16 md:px-24 lg:px-30 py-4 sm:py-6 md:py-10 lg:py-15 !text-2xl md:!text-3xl lg:!text-5xl !cursor-pointer uppercase font-extrabold ${nexaHeavy.className}`}
                text="Browse Our Packs"
              />
            </motion.div>
          </Link>
        </motion.div>

        <motion.div
          variants={itemVariants}
          animate={{
            y: [0, 10, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        >
          <Link href="#mid" aria-label="Scroll down">
            <div className="mt-8 md:mt-12 lg:mt-20 flex flex-col items-center">
              <span className="text-gray-400 text-sm mb-2">Scroll Down</span>
              <CaretDownIcon className="size-8 md:size-12 lg:size-16 dark-pulse rounded-sm cursor-pointer" />
            </div>
          </Link>
        </motion.div>
      </motion.div>

      {/* Info Section */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{
          opacity: 1,
          transition: { duration: 0.8, delay: 0.2 },
        }}
        viewport={{ once: true }}
        className="flex flex-col px-4 sm:px-6 md:px-8 lg:px-16 py-16 md:py-24 lg:py-32 mt-20 md:mt-40 lg:mt-60"
        id="mid"
      >
        <div className="flex flex-col lg:flex-row justify-center items-center gap-8 md:gap-12 lg:gap-20">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            whileInView={{
              x: 0,
              opacity: 1,
              transition: { duration: 0.6, delay: 0.3 },
            }}
            viewport={{ once: true }}
            className="flex flex-col w-full lg:w-[45%] gap-6"
          >
            <h1
              className={`${nexaHeavy.className} text-4xl sm:text-5xl md:text-6xl lg:text-8xl mb-4 md:mb-6 lg:mb-10 text-center lg:text-left lg:ml-10 dark-heading relative`}
            >
              General Info
              <span className="dark-underline"></span>
            </h1>

            <motion.div
              whileHover={{ scale: 1.02, transition: { duration: 0.3 } }}
              className="dark-panel bg-black/60 p-6 md:p-8 lg:p-10 rounded-none shadow-neo-dark"
            >
              <div className="panel-header">
                <h2
                  className={`${nexaLight.className} text-3xl md:text-4xl lg:text-6xl mb-3 md:mb-4 lg:mb-5 dark-heading`}
                >
                  Security & Privacy
                </h2>
                <div className="panel-indicator-dark"></div>
              </div>
              <h3
                className={`text-lg md:text-xl lg:text-2xl ${nexaLight.className} text-justify panel-content`}
              >
                As a community, we are committed to protecting your privacy at
                all times. Whether it concerns information you provide on our
                website or files you choose to download, we will never endanger
                your personal data. We do not track, sell, or share any private
                information, and we strictly uphold the principles of digital
                safety and confidentiality. Your trust means everything to us,
                and we will always work to maintain a safe, respectful
                environment for everyone -{" "}
                <span className="font-bold dark-highlight">
                  Andrew & The Staff Team.{" "}
                </span>
                See our{" "}
                <Link href="/PPandTOS" className="dark-link">
                  Privacy Policy and Terms Of Service
                </Link>{" "}
                for more info.
              </h3>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, transition: { duration: 0.3 } }}
              className="dark-panel bg-black/60 p-6 md:p-8 lg:p-10 rounded-none shadow-neo-dark"
            >
              <div className="panel-header">
                <h2
                  className={`${nexaLight.className} text-3xl md:text-4xl lg:text-6xl mb-3 md:mb-4 lg:mb-5 dark-heading`}
                >
                  Owners and Development
                </h2>
                <div className="panel-indicator-dark"></div>
              </div>
              <h3
                className={`text-lg md:text-xl lg:text-2xl ${nexaLight.className} text-justify panel-content`}
              >
                The community is managed by{" "}
                <span className="dark-badge text-gray-300">Benni</span> and{" "}
                <span className="dark-badge text-gray-300">Ebonics</span>, who
                take care of everything behind the scenes. They handle the
                planning, organization, and make sure everything runs smoothly.
                All technical and development work is done by{" "}
                <span className="dark-badge text-gray-300">Andrew</span>. He
                makes sure the platform works well, fixes any problems, and adds
                new features when needed. The team is small but effective, with
                each person focusing on their own tasks. Together, they keep
                everything running in a clear and professional way.
              </h3>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ x: 50, opacity: 0 }}
            whileInView={{
              x: 0,
              opacity: 1,
              transition: { duration: 0.6, delay: 0.3 },
            }}
            viewport={{ once: true }}
            className="w-full lg:w-[45%] mt-8 lg:mt-0 flex justify-center"
          >
            <div className="relative w-full max-w-[900px] overflow-hidden shadow-digital-dark group transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/80 pointer-events-none z-10 opacity-60 group-hover:opacity-40 transition-opacity duration-300"></div>
              <div className="absolute inset-0 border-2 border-gray-800/40 z-20 pointer-events-none group-hover:border-gray-700/60 transition-all duration-300"></div>

              {/* Top corners */}
              <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-gray-700"></div>
              <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-gray-700"></div>

              {/* Bottom corners */}
              <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-gray-700"></div>
              <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-gray-700"></div>

              <div className="absolute top-0 left-0 right-0 bg-black/90 backdrop-blur-sm flex items-center px-4 py-3 z-30 border-b border-gray-800/50">
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

                {/* Added tech details */}
                <div className="ml-auto flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-xs text-green-400">ONLINE</span>
                </div>
              </div>

              <div className="w-full pt-12">
                <iframe
                  src="https://discord.com/widget?id=1143265402449842227&theme=dark"
                  width="100%"
                  height="600"
                  frameBorder="0"
                  sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
                  style={{
                    height: "calc(100vh - 400px)",
                    minHeight: "450px",
                    maxHeight: "800px",
                  }}
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-gray-800/30 to-transparent"></div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Body;
