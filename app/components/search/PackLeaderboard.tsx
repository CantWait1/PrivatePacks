"use client";

import type React from "react";
import { useEffect, useState } from "react";
import {
  Loader2,
  TrophyIcon,
  Download,
  X,
  Heart,
  Eye,
  ChevronLeft,
  ChevronRight,
  Star,
} from "lucide-react";
import { nexaLight } from "@/fonts/fonts";
import StarRating from "../search/StarRating";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import CommentSection from "../search/CommentSection";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltipExtra";

interface LeaderboardPack {
  id: number;
  name: string;
  author: string;
  averageRating: number;
  ratingCount: number;
  downloadCount: number;
  viewCount: number;
  iconImage: string;
}

// Extended pack interface with additional fields needed for the dialog
interface ExtendedPack extends LeaderboardPack {
  resolution?: string;
  tags?: string[];
  downloadUrl?: string;
  additionalImages?: string[];
  isFavorited?: boolean;
  createdAt?: string;
}

const PackLeaderboard: React.FC = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [topPacks, setTopPacks] = useState<LeaderboardPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"rating" | "downloads" | "views">(
    "rating"
  );

  // Dialog related states
  const [selectedPack, setSelectedPack] = useState<ExtendedPack | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [ratingUpdates, setRatingUpdates] = useState<Record<number, number>>(
    {}
  );

  useEffect(() => {
    const fetchTopPacks = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/leaderboard", {
          method: "GET",
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch top packs: ${res.statusText}`);
        }

        const data = await res.json();
        setTopPacks(data);
      } catch (err) {
        console.error("Error fetching top packs:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTopPacks();
  }, []);

  const handlePackClick = async (pack: LeaderboardPack) => {
    try {
      // Fetch full pack details when clicked
      const res = await fetch(`/api/packs/${pack.id}`);
      if (!res.ok) {
        throw new Error("Failed to fetch pack details");
      }

      const data = await res.json();
      const fullPack = data.pack;

      // Check if the user has already viewed this pack in this session
      const viewedPacks = JSON.parse(
        sessionStorage.getItem("viewedPacks") || "[]"
      );
      const hasViewed = viewedPacks.includes(pack.id);

      if (!hasViewed && session?.user) {
        // Add to viewed packs in session storage
        sessionStorage.setItem(
          "viewedPacks",
          JSON.stringify([...viewedPacks, pack.id])
        );

        // Update view count on server
        const viewRes = await fetch("/api/views", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ packId: pack.id }),
        });

        if (viewRes.ok) {
          const viewData = await viewRes.json();
          fullPack.viewCount = viewData.viewCount;

          // Update the pack in topPacks state
          setTopPacks((currentPacks) =>
            currentPacks.map((p) =>
              p.id === pack.id ? { ...p, viewCount: viewData.viewCount } : p
            )
          );
        }
      }

      // Ensure we have additionalImages (use placeholders if not available)
      const updatedPack = {
        ...fullPack,
        additionalImages: fullPack.additionalImages || [
          "/placeholder.svg?height=400&width=400",
          "/placeholder.svg?height=400&width=400",
          "/placeholder.svg?height=400&width=400",
        ],
      };

      setSelectedPack(updatedPack);
      setCurrentImageIndex(0);
    } catch (error) {
      console.error("Error handling pack click:", error);
    }
  };

  const handleDownload = async (packId: number, downloadUrl: string) => {
    try {
      window.open(downloadUrl, "_blank");
      const res = await fetch("/api/search", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });

      if (!res.ok) {
        throw new Error("Failed to update download count");
      }

      const data = await res.json();

      // Update the download count in our local state
      setTopPacks((currentPacks) =>
        currentPacks.map((pack) =>
          pack.id === packId
            ? { ...pack, downloadCount: data.downloadCount }
            : pack
        )
      );

      setSelectedPack(null);
    } catch (error) {
      console.error("Error handling download:", error);
    }
  };

  const handleRatingChange = async (packId: number, newRating: number) => {
    if (!session?.user) {
      router.push("/sign-in");
      return;
    }

    setRatingUpdates((prev) => ({
      ...prev,
      [packId]: newRating,
    }));

    try {
      const res = await fetch(`/api/rating?packId=${packId}`);
      if (!res.ok) throw new Error("Failed to fetch updated rating");

      const data = await res.json();

      // Update the rating in our local state
      setTopPacks((currentPacks) =>
        currentPacks.map((pack) =>
          pack.id === packId
            ? {
                ...pack,
                averageRating: data.averageRating,
                ratingCount: data.ratingCount,
              }
            : pack
        )
      );

      // Update selected pack if open
      if (selectedPack && selectedPack.id === packId) {
        setSelectedPack({
          ...selectedPack,
          averageRating: data.averageRating,
          ratingCount: data.ratingCount,
        });
      }
    } catch (error) {
      console.error("Error fetching updated rating:", error);
    }
  };

  const handleRemoveRating = async (packId: number) => {
    if (!session?.user) {
      router.push("/sign-in");
      return;
    }

    try {
      const res = await fetch("/api/rating/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });

      if (!res.ok) throw new Error("Failed to remove rating");

      const data = await res.json();

      // Update the pack in the local state
      setTopPacks((currentPacks) =>
        currentPacks.map((pack) =>
          pack.id === packId
            ? {
                ...pack,
                averageRating: data.averageRating,
                ratingCount: data.ratingCount,
              }
            : pack
        )
      );

      // Update selected pack if open
      if (selectedPack && selectedPack.id === packId) {
        setSelectedPack({
          ...selectedPack,
          averageRating: data.averageRating,
          ratingCount: data.ratingCount,
        });
      }

      // Remove from rating updates
      setRatingUpdates((prev) => {
        const newUpdates = { ...prev };
        delete newUpdates[packId];
        return newUpdates;
      });
    } catch (error) {
      console.error("Error removing rating:", error);
    }
  };

  const toggleFavorite = async (e: React.MouseEvent, packId: number) => {
    e.stopPropagation();

    if (!session?.user) {
      router.push("/sign-in");
      return;
    }

    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });

      if (!res.ok) throw new Error("Failed to toggle favorite");

      const data = await res.json();

      // Update selected pack if open
      if (selectedPack && selectedPack.id === packId) {
        setSelectedPack({
          ...selectedPack,
          isFavorited: data.action === "added",
        });
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const fetchUserProfile = async (username: string) => {
    try {
      const res = await fetch(
        `/api/users/profile?username=${encodeURIComponent(username)}`
      );
      if (!res.ok) throw new Error("Failed to fetch user profile");

      const data = await res.json();
      // Handle the profile data as needed
      // For now, we'll just log it
      console.log("User profile:", data);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const nextImage = () => {
    if (selectedPack && selectedPack.additionalImages) {
      setCurrentImageIndex((prev) =>
        prev === selectedPack.additionalImages!.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (selectedPack && selectedPack.additionalImages) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? selectedPack.additionalImages!.length - 1 : prev - 1
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-6">
        <Loader2 className="animate-spin text-white" size={24} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-400 p-4 text-center">
        Error loading leaderboard: {error}
      </div>
    );
  }

  const sortedPacks = [...topPacks]
    .sort((a, b) => {
      if (activeTab === "rating") {
        return b.averageRating !== a.averageRating
          ? b.averageRating - a.averageRating
          : b.ratingCount - a.ratingCount;
      } else if (activeTab === "views") {
        return b.viewCount - a.viewCount;
      } else {
        return b.downloadCount - a.downloadCount;
      }
    })
    .slice(0, 10);

  return (
    <div
      className={`${nexaLight.className} bg-[#111] border-[#333] border text-white p-6 rounded-md shadow-xl`}
    >
      <div className="flex items-center gap-2 mb-4">
        <TrophyIcon className="text-yellow-400" size={24} />
        <h3 className="text-xl font-bold">Pack Leaderboard</h3>
      </div>

      <div className="flex border-b border-neutral-700 mb-4">
        <button
          className={`px-3 py-2 text-sm ${
            activeTab === "rating"
              ? "border-b-2 border-white font-semibold"
              : "text-gray-400"
          }`}
          onClick={() => setActiveTab("rating")}
        >
          Top Rated
        </button>
        <button
          className={`px-3 py-2 text-sm ${
            activeTab === "downloads"
              ? "border-b-2 border-white font-semibold"
              : "text-gray-400"
          }`}
          onClick={() => setActiveTab("downloads")}
        >
          Most Downloaded
        </button>
        <button
          className={`px-3 py-2 text-sm ${
            activeTab === "views"
              ? "border-b-2 border-white font-semibold"
              : "text-gray-400"
          }`}
          onClick={() => setActiveTab("views")}
        >
          Most Viewed
        </button>
      </div>

      <div className="space-y-3">
        {sortedPacks.length > 0 ? (
          sortedPacks.map((pack, index) => (
            <div
              key={pack.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
              onClick={() => handlePackClick(pack)}
            >
              <div className="font-bold text-xl w-6 text-center text-gray-500">
                {index + 1}
              </div>
              <div className="h-10 w-10 bg-neutral-800 rounded-md overflow-hidden">
                <img
                  src={pack.iconImage || "/placeholder.svg"}
                  alt={pack.name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "/api/placeholder/64/64";
                  }}
                />
              </div>
              <div className="flex-grow min-w-0">
                <div className="font-semibold text-sm truncate">
                  {pack.name}
                </div>
                <div className="text-xs text-gray-400 truncate">
                  By {pack.author}
                </div>
              </div>
              <div className="text-right">
                {activeTab === "rating" ? (
                  <div className="flex flex-col items-end">
                    <StarRating rating={pack.averageRating} size={14} />
                    <span className="text-xs text-gray-400">
                      {pack.ratingCount}{" "}
                      {pack.ratingCount === 1 ? "rating" : "ratings"}
                    </span>
                  </div>
                ) : activeTab === "views" ? (
                  <div className="text-sm font-semibold">
                    {pack.viewCount.toLocaleString()}
                    <span className="text-xs text-gray-400 block">views</span>
                  </div>
                ) : (
                  <div className="text-sm font-semibold">
                    {pack.downloadCount.toLocaleString()}
                    <span className="text-xs text-gray-400 block">
                      downloads
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-400 py-4">
            No packs to display
          </div>
        )}
      </div>

      {/* Pack Detail Dialog */}
      <Dialog
        open={!!selectedPack}
        onOpenChange={(open) => !open && setSelectedPack(null)}
      >
        <DialogContent className="sm:max-w-[700px] bg-neutral-900 border-neutral-800 text-white p-0 overflow-hidden rounded-xl">
          {selectedPack && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col max-h-[90vh]"
            >
              <DialogTitle className="sr-only">
                {selectedPack.name} - Pack Details
              </DialogTitle>

              <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/90 backdrop-blur-sm">
                <h2 className="text-xl font-bold truncate">
                  {selectedPack.name}
                </h2>
                <DialogClose className="rounded-full p-1 hover:bg-neutral-800 transition-colors">
                  <X className="h-5 w-5" />
                  <span className="sr-only">Close</span>
                </DialogClose>
              </div>

              <div className="flex-grow overflow-y-auto custom-scrollbar">
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="w-full grid grid-cols-2 p-0 bg-neutral-800/50">
                    <TabsTrigger
                      value="details"
                      className="data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-none py-3"
                    >
                      Details
                    </TabsTrigger>
                    <TabsTrigger
                      value="comments"
                      className="data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-none py-3"
                    >
                      Comments
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="p-5">
                    <div className="relative mb-5 aspect-video bg-neutral-800 rounded-lg overflow-hidden shadow-lg">
                      <motion.img
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        key={currentImageIndex}
                        src={
                          selectedPack.additionalImages?.[currentImageIndex] ||
                          selectedPack.iconImage ||
                          "/placeholder.svg"
                        }
                        alt={`${selectedPack.name} preview ${
                          currentImageIndex + 1
                        }`}
                        className="w-full h-full object-contain"
                      />

                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          prevImage();
                        }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-sm rounded-full p-2 hover:bg-black/80 transition-colors"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          nextImage();
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-sm rounded-full p-2 hover:bg-black/80 transition-colors"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </motion.button>

                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {selectedPack.additionalImages?.map((_, index) => (
                          <motion.button
                            key={index}
                            whileHover={{ scale: 1.2 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentImageIndex(index);
                            }}
                            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                              currentImageIndex === index
                                ? "bg-white scale-125"
                                : "bg-white/50"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="bg-neutral-800/50 backdrop-blur-sm rounded-lg p-4 border border-neutral-700/30">
                          <h3 className="font-semibold mb-3 text-blue-400">
                            Details
                          </h3>
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Author:</span>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() =>
                                        fetchUserProfile(selectedPack.author)
                                      }
                                      className="text-blue-400 hover:underline transition-colors"
                                    >
                                      {selectedPack.author}
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>View profile</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Resolution:</span>
                              <span className="bg-neutral-700/50 px-2 py-0.5 rounded-full text-xs">
                                {selectedPack.resolution || "Unknown"}
                              </span>
                            </div>
                            <div className="flex justify-between items-start">
                              <span className="text-gray-400">Rating:</span>
                              <div className="flex flex-col items-end">
                                {session?.user ? (
                                  <StarRating
                                    rating={0} // Empty stars for rating
                                    packId={selectedPack.id}
                                    editable={true}
                                    size={18}
                                    onRatingChange={(newRating) =>
                                      handleRatingChange(
                                        selectedPack.id,
                                        newRating
                                      )
                                    }
                                  />
                                ) : (
                                  <div className="flex items-center">
                                    <StarRating rating={0} size={18} />
                                    <span className="text-xs text-gray-400 ml-2">
                                      (Sign in to rate)
                                    </span>
                                  </div>
                                )}
                                {ratingUpdates[selectedPack.id] && (
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-green-500">
                                      You rated this{" "}
                                      {ratingUpdates[selectedPack.id]} stars
                                    </span>
                                    <button
                                      onClick={() =>
                                        handleRemoveRating(selectedPack.id)
                                      }
                                      className="text-xs text-red-400 hover:text-red-300 transition-colors"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-neutral-800/50 backdrop-blur-sm rounded-lg p-4 border border-neutral-700/30">
                          <h3 className="font-semibold mb-3 text-blue-400">
                            Stats
                          </h3>
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <Download size={16} className="text-gray-400" />
                                <span className="text-gray-300">Downloads</span>
                              </div>
                              <span className="font-medium">
                                {selectedPack.downloadCount.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <Eye size={16} className="text-gray-400" />
                                <span className="text-gray-300">Views</span>
                              </div>
                              <span className="font-medium">
                                {(selectedPack.viewCount || 0).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <Star size={16} className="text-gray-400" />
                                <span className="text-gray-300">
                                  Average Rating
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="font-medium">
                                  {selectedPack.averageRating.toFixed(1)}
                                </span>
                                <span className="text-gray-400 text-xs">
                                  ({selectedPack.ratingCount} ratings)
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-neutral-800/50 backdrop-blur-sm rounded-lg p-4 border border-neutral-700/30">
                          <h3 className="font-semibold mb-3 text-blue-400">
                            Tags
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {selectedPack.tags &&
                            selectedPack.tags.length > 0 ? (
                              selectedPack.tags.map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="outline"
                                  className="bg-neutral-700/50 hover:bg-neutral-700 transition-colors text-gray-200 border-neutral-600/50"
                                >
                                  {tag}
                                </Badge>
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
                  </TabsContent>

                  <TabsContent value="comments" className="p-5">
                    <CommentSection packId={selectedPack.id} />
                  </TabsContent>
                </Tabs>
              </div>

              <div className="p-4 border-t border-neutral-800 flex gap-3 bg-neutral-900/90 backdrop-blur-sm">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-xl text-center flex-1 transition-colors duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (selectedPack.downloadUrl) {
                      handleDownload(selectedPack.id, selectedPack.downloadUrl);
                    }
                  }}
                >
                  <Download size={18} />
                  Download
                </motion.button>
                {session?.user && (
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className={`py-2 px-4 rounded-xl text-center transition-colors duration-200 flex items-center justify-center gap-2 ${
                      selectedPack.isFavorited
                        ? "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20"
                        : "bg-neutral-800 hover:bg-neutral-700 text-white"
                    }`}
                    onClick={(e) => toggleFavorite(e, selectedPack.id)}
                  >
                    <Heart
                      size={18}
                      className={selectedPack.isFavorited ? "fill-white" : ""}
                    />
                    {selectedPack.isFavorited ? "Favorited" : "Favorite"}
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PackLeaderboard;
