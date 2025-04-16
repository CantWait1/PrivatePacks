"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { nexaLight } from "@/fonts/fonts";

interface Pack {
  id: number;
  name: string;
  author: string;
  resolution: string;
  iconImage: string;
  tags: string[];
  downloadUrl?: string;
  downloadCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function RandomPackGrid() {
  const [currentPack, setCurrentPack] = useState<Pack | null>(null);

  const fetchRandomPack = async () => {
    const res = await fetch("/api/random-pack");
    const data = await res.json();
    setCurrentPack(data);
  };

  useEffect(() => {
    fetchRandomPack();

    const interval = setInterval(() => {
      fetchRandomPack();
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  if (!currentPack) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentPack.id}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.5 }}
        className="bg-neutral-900 rounded-2xl border border-neutral-700 overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
      >
        <Link href="" className="flex items-center p-6">
          <div className="w-40 h-40 shrink-0 overflow-hidden mr-6">
            <img
              src={currentPack.iconImage}
              alt={currentPack.name}
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
          <div className={`flex-1 ${nexaLight.className}`}>
            <h3 className="text-white text-2xl font-semibold mb-2 truncate">
              {currentPack.name}
            </h3>
            <p className="text-base text-gray-400 mb-2 truncate">
              by {currentPack.author}
            </p>
            <p className="text-sm text-gray-200">
              {currentPack.resolution} •{" "}
              {currentPack.downloadCount.toLocaleString()} downloads •{" "}
              {currentPack.viewCount.toLocaleString()} views
            </p>
          </div>
        </Link>
      </motion.div>
    </AnimatePresence>
  );
}
