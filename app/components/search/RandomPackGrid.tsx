"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Shuffle, ArrowRight, Loader2 } from "lucide-react";
import {
  CustomDialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogButton,
} from "@/components/ui/custom-dialog";

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
  additionalImages?: string[];
}

interface RandomPackGridProps {
  packs?: Pack[];
}

export default function RandomPackGrid({ packs }: RandomPackGridProps) {
  const [currentPack, setCurrentPack] = useState<Pack | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const fetchRandomPack = async () => {
    setLoading(true);
    try {
      if (packs && packs.length > 0) {
        // If packs are provided, select a random one from the array
        const randomIndex = Math.floor(Math.random() * packs.length);
        setCurrentPack(packs[randomIndex]);
      } else {
        // Otherwise fetch from API
        const res = await fetch("/api/random-pack");
        const data = await res.json();
        setCurrentPack(data);
      }
    } catch (error) {
      console.error("Error fetching random pack:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRandomPack();

    const interval = setInterval(() => {
      fetchRandomPack();
    }, 20000);

    return () => clearInterval(interval);
  }, [packs]);

  const handlePackClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (currentPack) {
      setShowDialog(true);
    }
  };

  const nextImage = () => {
    if (currentPack?.additionalImages?.length) {
      setCurrentImageIndex((prev) =>
        prev === currentPack.additionalImages!.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (currentPack?.additionalImages?.length) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? currentPack.additionalImages!.length - 1 : prev - 1
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="animate-spin text-blue-500" size={30} />
      </div>
    );
  }

  if (!currentPack) return null;

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPack.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.5 }}
          className="bg-[#1a1a1a] rounded-md border border-[#333] overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
        >
          <Link
            href={`/pack/${currentPack.id}`}
            className="flex items-center p-4"
            onClick={handlePackClick}
          >
            <div className="w-24 h-24 shrink-0 overflow-hidden mr-4">
              <img
                src={currentPack.iconImage || "/placeholder.svg"}
                alt={currentPack.name}
                className="w-full h-full object-cover rounded-md"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/api/placeholder/64/64";
                }}
              />
            </div>
            <div className="flex-1">
              <h3 className="text-white text-lg font-semibold mb-1 truncate">
                {currentPack.name}
              </h3>
              <p className="text-sm text-gray-400 mb-1 truncate">
                by {currentPack.author}
              </p>
              <p className="text-xs text-gray-300">
                {currentPack.resolution} •{" "}
                {currentPack.downloadCount.toLocaleString()} downloads
              </p>
              <div className="mt-2">
                <button className="flex items-center text-blue-400 hover:text-blue-300 transition-colors text-sm">
                  <span>View Pack</span>
                  <ArrowRight className="ml-1 h-3 w-3" />
                </button>
              </div>
            </div>
          </Link>
          <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-md flex items-center">
            <Shuffle className="h-3 w-3 mr-1" />
            <span>Random</span>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Pack Details Dialog */}
      <CustomDialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        className="w-full max-w-2xl"
      >
        <DialogHeader>
          <DialogTitle>{currentPack.name}</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <div className="space-y-4">
            {/* Image carousel */}
            <div className="relative aspect-video bg-[#111] rounded-md overflow-hidden">
              <img
                src={
                  currentPack.additionalImages &&
                  currentPack.additionalImages.length > 0
                    ? currentPack.additionalImages[currentImageIndex]
                    : currentPack.iconImage
                }
                alt={`${currentPack.name} preview`}
                className="w-full h-full object-contain"
              />

              {currentPack.additionalImages &&
                currentPack.additionalImages.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 rounded-md p-2 hover:bg-black/80 transition-colors"
                    >
                      <ArrowRight className="h-5 w-5 transform rotate-180" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 rounded-md p-2 hover:bg-black/80 transition-colors"
                    >
                      <ArrowRight className="h-5 w-5" />
                    </button>

                    {/* Image indicators */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {currentPack.additionalImages.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                            currentImageIndex === index
                              ? "bg-white scale-125"
                              : "bg-white/50"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#111] p-4 rounded-md border border-[#333]">
                <h4 className="text-blue-400 font-medium mb-2">Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Author:</span>
                    <span className="text-white">{currentPack.author}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Resolution:</span>
                    <span className="bg-[#222] px-2 py-0.5 rounded-md text-xs">
                      {currentPack.resolution}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Downloads:</span>
                    <span className="text-white">
                      {currentPack.downloadCount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Views:</span>
                    <span className="text-white">
                      {currentPack.viewCount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-[#111] p-4 rounded-md border border-[#333]">
                <h4 className="text-blue-400 font-medium mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {currentPack.tags && currentPack.tags.length > 0 ? (
                    currentPack.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-[#222] text-gray-200 px-2 py-1 rounded-md text-xs"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400 text-sm">
                      No tags available
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
        <DialogFooter>
          <DialogButton variant="outline" onClick={() => setShowDialog(false)}>
            Close
          </DialogButton>
          <DialogButton
            onClick={() => {
              if (currentPack.downloadUrl) {
                window.open(currentPack.downloadUrl, "_blank");
              }
              setShowDialog(false);
            }}
          >
            <ArrowRight className="mr-2 h-4 w-4" />
            Download Pack
          </DialogButton>
        </DialogFooter>
      </CustomDialog>
    </>
  );
}
