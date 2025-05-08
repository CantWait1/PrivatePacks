"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Download,
  X,
  Heart,
  Eye,
  Clock,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  SearchIcon,
  Star,
  ArrowUpDown,
  Filter,
  Sparkles,
  Layers,
  Grid3X3,
  Shuffle,
  Info,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import StarRating from "./StarRating";
import PackLeaderboard from "./PackLeaderboard";
import RandomPackGrid from "./RandomPackGrid";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import CommentSection from "./CommentSection";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltipExtra";

const resolutions = ["16x", "32x", "64x", "128x"];
const tagOptions = [
  "Bedwars",
  "Bridge",
  "PvP",
  "UHC",
  "Skywars",
  "Sky",
  "Overlays",
  "Blockhit",
];
const ratingOptions = [1, 2, 3, 4, 5];
const ITEMS_PER_PAGE = 12;
const RECENT_ITEMS_PER_ROW = 6;
const DOOM_SCROLL_ITEMS_PER_LOAD = 24;

interface Pack {
  id: number;
  name: string;
  author: string;
  resolution: string;
  iconImage: string;
  tags: string[];
  downloadUrl: string;
  downloadCount: number;
  averageRating: number;
  ratingCount: number;
  viewCount?: number;
  additionalImages?: string[];
  isFavorited?: boolean;
  createdAt: string;
}

interface UserProfile {
  id: number;
  username: string;
  bio?: string;
  role: string;
  createdAt: string;
  isVerified?: boolean;
}

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

const Search = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const filtersRef = useRef<HTMLDivElement>(null);
  const doomScrollRef = useRef<HTMLDivElement>(null);

  // Main tab state
  const [activeMainTab, setActiveMainTab] = useState<
    "filters" | "overlays" | "doomscroll"
  >("filters");

  const [filters, setFilters] = useState({
    name: "",
    resolution: "",
    author: "",
    tags: [] as string[],
    minRating: "",
    minDownloads: "",
    minViews: "",
    sortBy: "newest" as
      | "newest"
      | "oldest"
      | "rating"
      | "downloads"
      | "views"
      | "a-z"
      | "z-a"
      | "most-downloaded"
      | "least-downloaded"
      | "most-viewed"
      | "least-viewed",
  });

  // Overlay filters
  const [overlayFilters, setOverlayFilters] = useState({
    name: "",
    resolution: "",
    author: "",
    minRating: "",
    minDownloads: "",
    sortBy: "newest" as
      | "newest"
      | "oldest"
      | "rating"
      | "downloads"
      | "views"
      | "a-z"
      | "z-a",
  });
  const [showOverlayFilters, setShowOverlayFilters] = useState(false);

  const [packs, setPacks] = useState<Pack[]>([]);
  const [overlayPacks, setOverlayPacks] = useState<Pack[]>([]);
  const [doomScrollPacks, setDoomScrollPacks] = useState<Pack[]>([]);
  const [recentPacks, setRecentPacks] = useState<Pack[]>([]);
  const [randomGridPacks, setRandomGridPacks] = useState<Pack[]>([]);
  const [loading, setLoading] = useState(false);
  const [overlaysLoading, setOverlaysLoading] = useState(false);
  const [doomScrollLoading, setDoomScrollLoading] = useState(false);
  const [randomGridLoading, setRandomGridLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overlayError, setOverlayError] = useState<string | null>(null);
  const [ratingUpdates, setRatingUpdates] = useState<Record<number, number>>(
    {}
  );

  const [selectedPack, setSelectedPack] = useState<Pack | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [userFavorites, setUserFavorites] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [recentPage, setRecentPage] = useState(1);
  const [totalRecentPages, setTotalRecentPages] = useState(1);
  const [overlayPage, setOverlayPage] = useState(1);
  const [totalOverlayPages, setTotalOverlayPages] = useState(1);
  const [doomScrollPage, setDoomScrollPage] = useState(1);
  const [hasMoreDoomScroll, setHasMoreDoomScroll] = useState(true);

  // User profile
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);

  useEffect(() => {
    fetchRecentPacks();
    fetchRandomGridPacks();

    if (status !== "loading") {
      fetchPacks();
      if (activeMainTab === "overlays") {
        fetchOverlayPacks();
      } else if (activeMainTab === "doomscroll") {
        fetchDoomScrollPacks();
      }
    }
  }, [status, activeMainTab]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchUserFavorites();
    }
  }, [status]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when filters change
      fetchPacks();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [filters, userFavorites]);

  useEffect(() => {
    fetchPacks();
  }, [currentPage]);

  useEffect(() => {
    fetchRecentPacks();
  }, [recentPage]);

  useEffect(() => {
    if (activeMainTab === "overlays") {
      fetchOverlayPacks();
    }
  }, [overlayPage, activeMainTab]);

  // Infinite scroll for doom scrolling
  useEffect(() => {
    if (activeMainTab === "doomscroll" && doomScrollRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (
            entries[0].isIntersecting &&
            !doomScrollLoading &&
            hasMoreDoomScroll
          ) {
            loadMoreDoomScrollPacks();
          }
        },
        { threshold: 0.1 }
      );

      observer.observe(doomScrollRef.current);
      return () => observer.disconnect();
    }
  }, [
    activeMainTab,
    doomScrollLoading,
    hasMoreDoomScroll,
    doomScrollRef.current,
  ]);

  // Add useEffect to check for viewPackId in localStorage
  useEffect(() => {
    // Check if there's a pack ID to view in localStorage
    const packIdToView = localStorage.getItem("viewPackId");
    if (packIdToView) {
      // Clear it immediately to prevent reopening on refresh
      localStorage.removeItem("viewPackId");

      // Find the pack in the loaded packs
      const packId = Number.parseInt(packIdToView, 10);
      const packToView = packs.find((p) => p.id === packId);

      if (packToView) {
        handlePackClick(packToView);
      } else {
        // If pack isn't in the current list, fetch it directly
        fetchPackById(packId);
      }
    }
  }, [packs]);

  const fetchRandomGridPacks = async () => {
    try {
      setRandomGridLoading(true);
      const res = await fetch("/api/random-grid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 12 }),
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch random grid packs: ${res.statusText}`);
      }

      const data = await res.json();
      setRandomGridPacks(data.packs);
    } catch (err) {
      console.error("Error fetching random grid packs:", err);
    } finally {
      setRandomGridLoading(false);
    }
  };

  const loadMoreDoomScrollPacks = async () => {
    if (doomScrollLoading || !hasMoreDoomScroll) return;

    const nextPage = doomScrollPage + 1;
    setDoomScrollPage(nextPage);
    await fetchDoomScrollPacks(nextPage, true);
  };

  // Add function to fetch a specific pack by ID
  const fetchPackById = async (packId: number) => {
    try {
      const res = await fetch(`/api/packs/${packId}`);
      if (!res.ok) {
        throw new Error("Failed to fetch pack");
      }

      const data = await res.json();
      handlePackClick(data.pack);
    } catch (error) {
      console.error("Error fetching pack:", error);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleOverlayInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setOverlayFilters((prev) => ({ ...prev, [name]: value }));
  };

  const toggleTag = (tag: string) => {
    const exists = filters.tags.includes(tag);
    setFilters((prev) => ({
      ...prev,
      tags: exists ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
    }));
  };

  const fetchUserFavorites = async () => {
    if (!session?.user) return;

    try {
      const res = await fetch("/api/favorites");
      if (!res.ok) throw new Error("Failed to fetch favorites");

      const data = await res.json();
      const favoriteIds = data.map((fav: any) => fav.packId);
      setUserFavorites(favoriteIds);

      // Update any existing packs with favorite status
      setPacks((currentPacks) =>
        currentPacks.map((pack) => ({
          ...pack,
          isFavorited: favoriteIds.includes(pack.id),
        }))
      );
    } catch (error) {
      console.error("Error fetching favorites:", error);
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

      if (data.action === "added") {
        setUserFavorites((prev) => [...prev, packId]);
      } else {
        setUserFavorites((prev) => prev.filter((id) => id !== packId));
      }

      // Update the pack in all pack lists
      const updatePacksWithFavorite = (packsList: Pack[]) =>
        packsList.map((pack) =>
          pack.id === packId
            ? { ...pack, isFavorited: data.action === "added" }
            : pack
        );

      setPacks(updatePacksWithFavorite);
      setOverlayPacks(updatePacksWithFavorite);
      setDoomScrollPacks(updatePacksWithFavorite);
      setRecentPacks(updatePacksWithFavorite);
      setRandomGridPacks(updatePacksWithFavorite);

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

  const fetchRecentPacks = async () => {
    try {
      const res = await fetch("/api/search/recent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page: recentPage, limit: RECENT_ITEMS_PER_ROW }),
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch recent packs: ${res.statusText}`);
      }

      const data = await res.json();
      setRecentPacks(data.packs);
      setTotalRecentPages(Math.ceil(data.total / RECENT_ITEMS_PER_ROW));
    } catch (err) {
      console.error("Error fetching recent packs:", err);
    }
  };

  const fetchOverlayPacks = async () => {
    try {
      setOverlaysLoading(true);
      setOverlayError(null);

      const res = await fetch("/api/search/overlays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page: overlayPage,
          limit: 24,
          name: overlayFilters.name,
          author: overlayFilters.author,
          resolution: overlayFilters.resolution,
          minRating: overlayFilters.minRating,
          minDownloads: overlayFilters.minDownloads,
          sortBy: overlayFilters.sortBy,
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch overlay packs: ${res.statusText}`);
      }

      const data = await res.json();
      setOverlayPacks(data.packs);
      setTotalOverlayPages(Math.ceil(data.total / 24));
    } catch (err) {
      console.error("Error fetching overlay packs:", err);
      setOverlayError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setOverlaysLoading(false);
    }
  };

  const handleOverlaySearch = () => {
    setOverlayPage(1);
    fetchOverlayPacks();
  };

  const clearOverlayFilters = () => {
    setOverlayFilters({
      name: "",
      resolution: "",
      author: "",
      minRating: "",
      minDownloads: "",
      sortBy: "newest",
    });
    setOverlayPage(1);
    setTimeout(() => fetchOverlayPacks(), 0);
  };

  const fetchDoomScrollPacks = async (page = 1, append = false) => {
    try {
      setDoomScrollLoading(true);
      const res = await fetch("/api/search/random", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page, limit: DOOM_SCROLL_ITEMS_PER_LOAD }),
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch doom scroll packs: ${res.statusText}`);
      }

      const data = await res.json();

      if (append) {
        setDoomScrollPacks((prev) => [...prev, ...data.packs]);
      } else {
        setDoomScrollPacks(data.packs);
      }

      setHasMoreDoomScroll(data.packs.length === DOOM_SCROLL_ITEMS_PER_LOAD);
    } catch (err) {
      console.error("Error fetching doom scroll packs:", err);
    } finally {
      setDoomScrollLoading(false);
    }
  };

  const fetchPacks = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...filters,
          page: currentPage,
          limit: ITEMS_PER_PAGE,
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch packs: ${res.statusText}`);
      }

      const data = await res.json();

      // Mark favorited packs based on userFavorites state
      const packsWithFavorites = data.packs.map((pack: Pack) => ({
        ...pack,
        isFavorited: userFavorites.includes(pack.id) || pack.isFavorited,
      }));

      setPacks(packsWithFavorites);
      setTotalPages(Math.ceil(data.total / ITEMS_PER_PAGE));
    } catch (err) {
      console.error("Error fetching packs:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async (username: string) => {
    try {
      const res = await fetch(
        `/api/users/profile?username=${encodeURIComponent(username)}`
      );
      if (!res.ok) throw new Error("Failed to fetch user profile");

      const data = await res.json();
      setSelectedUser(data);
      setShowUserProfile(true);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const handlePackClick = async (pack: Pack) => {
    try {
      // First check if the user has already viewed this pack in this session
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
        const res = await fetch("/api/views", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ packId: pack.id }),
        });

        if (!res.ok) {
          throw new Error("Failed to update view count");
        }

        const data = await res.json();

        // Update pack in state
        setPacks((currentPacks) =>
          currentPacks.map((p) =>
            p.id === pack.id ? { ...p, viewCount: data.viewCount } : p
          )
        );

        // Set the updated pack as selected
        const updatedPack = {
          ...pack,
          viewCount: data.viewCount,
          additionalImages: pack.additionalImages || [
            "/placeholder.svg?height=400&width=400",
            "/placeholder.svg?height=400&width=400",
            "/placeholder.svg?height=400&width=400",
          ],
        };

        setSelectedPack(updatedPack);
      } else {
        // Just open the dialog without incrementing view count
        const updatedPack = {
          ...pack,
          additionalImages: pack.additionalImages || [
            "/placeholder.svg?height=400&width=400",
            "/placeholder.svg?height=400&width=400",
            "/placeholder.svg?height=400&width=400",
          ],
        };

        setSelectedPack(updatedPack);
      }

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

      // Update download count in all pack lists
      const updatePacksWithDownload = (packsList: Pack[]) =>
        packsList.map((pack) =>
          pack.id === packId
            ? { ...pack, downloadCount: data.downloadCount }
            : pack
        );

      setPacks(updatePacksWithDownload);
      setOverlayPacks(updatePacksWithDownload);
      setDoomScrollPacks(updatePacksWithDownload);
      setRecentPacks(updatePacksWithDownload);
      setRandomGridPacks(updatePacksWithDownload);

      setSelectedPack(null);
    } catch (error) {
      console.error("Error handling download:", error);
    }
  };

  const handleRatingChange = (packId: number, newRating: number) => {
    if (!session?.user) {
      router.push("/sign-in");
      return;
    }

    setRatingUpdates((prev) => ({
      ...prev,
      [packId]: newRating,
    }));

    fetch(`/api/rating?packId=${packId}`)
      .then((res) => res.json())
      .then((data) => {
        // Update rating in all pack lists
        const updatePacksWithRating = (packsList: Pack[]) =>
          packsList.map((pack) =>
            pack.id === packId
              ? {
                  ...pack,
                  averageRating: data.averageRating,
                  ratingCount: data.ratingCount,
                }
              : pack
          );

        setPacks(updatePacksWithRating);
        setOverlayPacks(updatePacksWithRating);
        setDoomScrollPacks(updatePacksWithRating);
        setRecentPacks(updatePacksWithRating);
        setRandomGridPacks(updatePacksWithRating);
      })
      .catch((err) => console.error("Error fetching updated rating:", err));
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

      // Update rating in all pack lists
      const updatePacksWithRating = (packsList: Pack[]) =>
        packsList.map((pack) =>
          pack.id === packId
            ? {
                ...pack,
                averageRating: data.averageRating,
                ratingCount: data.ratingCount,
              }
            : pack
        );

      setPacks(updatePacksWithRating);
      setOverlayPacks(updatePacksWithRating);
      setDoomScrollPacks(updatePacksWithRating);
      setRecentPacks(updatePacksWithRating);
      setRandomGridPacks(updatePacksWithRating);

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

  const renderPagination = (
    page: number,
    totalPages: number,
    setPage: (page: number) => void
  ) => (
    <div className="flex justify-center items-center gap-2 mt-6">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setPage(Math.max(1, page - 1))}
        disabled={page === 1}
        className="bg-[#1a1a1a] border-[#333] hover:bg-[#222] hover:border-[#444]"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm font-medium bg-[#1a1a1a] px-3 py-1 rounded-md">
        {page} / {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setPage(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="bg-[#1a1a1a] border-[#333] hover:bg-[#222] hover:border-[#444]"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );

  // Render a single row of recent packs with pagination
  const renderRecentPacksRow = (packList: Pack[]) => {
    // Calculate how many packs to show per row based on screen size
    // For simplicity, we'll show up to 6 packs per row
    const packsToShow = packList.slice(0, RECENT_ITEMS_PER_ROW);

    return (
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4"
      >
        {packsToShow.map((pack) => (
          <motion.div
            key={pack.id}
            variants={itemVariant}
            whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
            className="bg-[#111] border border-[#333] rounded-md shadow-lg overflow-hidden hover:border-[#444] transition-all duration-300 cursor-pointer group"
            onClick={() => handlePackClick(pack)}
          >
            <div className="relative pb-[100%] w-full overflow-hidden">
              <img
                src={pack.iconImage || "/placeholder.svg"}
                alt={pack.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "/api/placeholder/400/400";
                }}
              />
              {session?.user && (
                <button
                  onClick={(e) => toggleFavorite(e, pack.id)}
                  className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded-md p-1.5 hover:bg-black/70 transition-colors z-10 transform hover:scale-110 duration-200"
                >
                  <Heart
                    size={16}
                    className={`${
                      pack.isFavorited
                        ? "fill-red-500 text-red-500"
                        : "text-white"
                    } transition-colors duration-300`}
                  />
                </button>
              )}
              {pack.additionalImages && pack.additionalImages.length > 0 && (
                <div className="absolute bottom-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-md">
                  +{pack.additionalImages.length} images
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div className="p-3 flex-grow flex flex-col">
              <h3 className="text-base font-medium mb-0.5 line-clamp-1 group-hover:text-white transition-colors duration-200">
                {pack.name}
              </h3>
              <p className="text-gray-400 mb-1 text-xs">By {pack.author}</p>
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-500 text-xs bg-[#1a1a1a] px-2 py-0.5 rounded-md">
                  {pack.resolution}
                </span>
              </div>

              <div className="mb-2">
                <StarRating
                  rating={pack.averageRating}
                  count={pack.ratingCount}
                  size={14}
                />
              </div>

              <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                <div className="flex items-center gap-1">
                  <Download size={10} />
                  <span>{pack.downloadCount.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye size={10} />
                  <span>{(pack.viewCount || 0).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mb-1">
                {pack.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-[#1a1a1a] text-gray-300 px-1.5 py-0.5 rounded-md"
                  >
                    {tag}
                  </span>
                ))}
                {pack.tags.length > 2 && (
                  <span className="text-xs bg-[#1a1a1a] text-gray-300 px-1.5 py-0.5 rounded-md">
                    +{pack.tags.length - 2}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    );
  };

  const renderPackGrid = (packList: Pack[]) => (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4"
    >
      {packList.map((pack) => (
        <motion.div
          key={pack.id}
          variants={itemVariant}
          whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
          className="bg-[#111] border border-[#333] rounded-md shadow-lg overflow-hidden hover:border-[#444] transition-all duration-300 cursor-pointer group"
          onClick={() => handlePackClick(pack)}
        >
          <div className="relative pb-[100%] w-full overflow-hidden">
            <img
              src={pack.iconImage || "/placeholder.svg"}
              alt={pack.name}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/api/placeholder/400/400";
              }}
            />
            {session?.user && (
              <button
                onClick={(e) => toggleFavorite(e, pack.id)}
                className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded-md p-1.5 hover:bg-black/70 transition-colors z-10 transform hover:scale-110 duration-200"
              >
                <Heart
                  size={16}
                  className={`${
                    pack.isFavorited
                      ? "fill-red-500 text-red-500"
                      : "text-white"
                  } transition-colors duration-300`}
                />
              </button>
            )}
            {pack.additionalImages && pack.additionalImages.length > 0 && (
              <div className="absolute bottom-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-md">
                +{pack.additionalImages.length} images
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
          <div className="p-3 flex-grow flex flex-col">
            <h3 className="text-base font-medium mb-0.5 line-clamp-1 group-hover:text-white transition-colors duration-200">
              {pack.name}
            </h3>
            <p className="text-gray-400 mb-1 text-xs">By {pack.author}</p>
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-500 text-xs bg-[#1a1a1a] px-2 py-0.5 rounded-md">
                {pack.resolution}
              </span>
            </div>

            <div className="mb-2">
              <StarRating
                rating={pack.averageRating}
                count={pack.ratingCount}
                size={14}
              />
            </div>

            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
              <div className="flex items-center gap-1">
                <Download size={10} />
                <span>{pack.downloadCount.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye size={10} />
                <span>{(pack.viewCount || 0).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1 mb-1">
              {pack.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-[#1a1a1a] text-gray-300 px-1.5 py-0.5 rounded-md"
                >
                  {tag}
                </span>
              ))}
              {pack.tags.length > 2 && (
                <span className="text-xs bg-[#1a1a1a] text-gray-300 px-1.5 py-0.5 rounded-md">
                  +{pack.tags.length - 2}
                </span>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );

  const renderRandomGrid = (packList: Pack[]) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
      {packList.map((pack) => (
        <div
          key={pack.id}
          className="bg-[#111] border border-[#333] rounded-md shadow-lg overflow-hidden hover:border-[#444] transition-all duration-300 cursor-pointer group"
          onClick={() => handlePackClick(pack)}
        >
          <div className="relative pb-[100%] w-full overflow-hidden">
            <img
              src={pack.iconImage || "/placeholder.svg"}
              alt={pack.name}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/api/placeholder/400/400";
              }}
            />
            {pack.additionalImages && pack.additionalImages.length > 0 && (
              <div className="absolute bottom-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-md">
                +{pack.additionalImages.length} images
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
          <div className="p-3">
            <h3 className="text-base font-medium mb-0.5 line-clamp-1 group-hover:text-white transition-colors duration-200">
              {pack.name}
            </h3>
            <p className="text-gray-400 text-xs">By {pack.author}</p>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-9xl mx-auto px-4 py-8">
      {/* Main Tabs */}
      <div className="mb-6">
        <Tabs
          defaultValue="filters"
          value={activeMainTab}
          onValueChange={(value) =>
            setActiveMainTab(value as "filters" | "overlays" | "doomscroll")
          }
          className="w-full"
        >
          <TabsList className="w-full grid grid-cols-3 p-0 bg-[#FFFFFF]/20 rounded-md overflow-hidden border-[#0066ff]/20 border">
            <TabsTrigger
              value="filters"
              className="data-[state=active]:bg-zinc-900/60 data-[state=active]:text-white rounded-none py-3 text-lg"
            >
              <Filter className="h-5 w-5 mr-2 " />
              Filters
            </TabsTrigger>
            <TabsTrigger
              value="overlays"
              className="data-[state=active]:bg-zinc-900/60 data-[state=active]:text-white rounded-none py-3 text-lg"
            >
              <Layers className="h-5 w-5 mr-2" />
              Overlays
            </TabsTrigger>
            <TabsTrigger
              value="doomscroll"
              className="data-[state=active]:bg-zinc-900/60 data-[state=active]:text-white rounded-none py-3 text-lg"
            >
              <Grid3X3 className="h-5 w-5 mr-2" />
              Gallery
            </TabsTrigger>
          </TabsList>

          <TabsContent value="filters" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                {/* Main Search Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="bg-[#111] border-[#333] border text-white p-6 sm:p-7 rounded-md shadow-xl"
                >
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-8"
                  >
                    <motion.h2
                      initial={{ y: 20 }}
                      animate={{ y: 0 }}
                      transition={{ duration: 0.5, type: "spring" }}
                      className="text-3xl sm:text-4xl font-bold mb-2 sm:mb-3 text-blue-500"
                    >
                      Pack Search
                    </motion.h2>
                    <motion.p
                      initial={{ y: 20 }}
                      animate={{ y: 0 }}
                      transition={{ duration: 0.5, delay: 0.1, type: "spring" }}
                      className="text-lg sm:text-xl text-gray-300"
                    >
                      Filter through different private packs!
                    </motion.p>
                  </motion.div>

                  {/* Search bar and filter toggle */}
                  <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="relative flex-grow">
                      <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search by name..."
                        value={filters.name}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        className="pl-9 bg-[#1a1a1a] border-[#333] focus:border-blue-600 transition-all duration-300"
                      />
                    </div>
                    <Button
                      onClick={() => setShowFilters(!showFilters)}
                      className="bg-[#1a1a1a] hover:bg-[#222] text-white border-[#333] transition-all duration-300"
                    >
                      <SlidersHorizontal className="mr-2 h-4 w-4" />
                      {showFilters ? "Hide Filters" : "Show Filters"}
                    </Button>
                  </div>

                  {/* Filters section */}
                  <AnimatePresence>
                    {showFilters && (
                      <motion.div
                        ref={filtersRef}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden mb-6"
                      >
                        <div className="bg-[#1a1a1a] border border-[#333] rounded-md p-5 mb-6">
                          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Filter className="h-5 w-5 text-blue-500" />
                            <span>Advanced Filters</span>
                          </h3>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <label
                                htmlFor="resolution"
                                className="text-sm text-gray-300 font-medium"
                              >
                                Resolution
                              </label>
                              <select
                                id="resolution"
                                name="resolution"
                                value={filters.resolution}
                                onChange={handleInputChange}
                                className="w-full bg-[#111] border border-[#333] focus:border-blue-600 p-2 rounded-md text-white transition-all duration-300"
                              >
                                <option value="">All Resolutions</option>
                                {resolutions.map((res) => (
                                  <option key={res} value={res}>
                                    {res}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-2">
                              <label
                                htmlFor="author"
                                className="text-sm text-gray-300 font-medium"
                              >
                                Author
                              </label>
                              <Input
                                id="author"
                                type="text"
                                name="author"
                                placeholder="Author name"
                                value={filters.author}
                                onChange={handleInputChange}
                                className="bg-[#111] border-[#333] focus:border-blue-600 transition-all duration-300"
                              />
                            </div>

                            <div className="space-y-2">
                              <label
                                htmlFor="minRating"
                                className="text-sm text-gray-300 font-medium"
                              >
                                Minimum Rating
                              </label>
                              <select
                                id="minRating"
                                name="minRating"
                                value={filters.minRating}
                                onChange={handleInputChange}
                                className="w-full bg-[#111] border border-[#333] focus:border-blue-600 p-2 rounded-md text-white transition-all duration-300"
                              >
                                <option value="">Any Rating</option>
                                {ratingOptions.map((rating) => (
                                  <option key={rating} value={rating}>
                                    {rating}+ Stars
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-2">
                              <label
                                htmlFor="minDownloads"
                                className="text-sm text-gray-300 font-medium"
                              >
                                Minimum Downloads
                              </label>
                              <Input
                                id="minDownloads"
                                type="number"
                                name="minDownloads"
                                placeholder="Min downloads"
                                value={filters.minDownloads}
                                onChange={handleInputChange}
                                min="0"
                                className="bg-[#111] border-[#333] focus:border-blue-600 transition-all duration-300"
                              />
                            </div>

                            <div className="space-y-2">
                              <label
                                htmlFor="minViews"
                                className="text-sm text-gray-300 font-medium"
                              >
                                Minimum Views
                              </label>
                              <Input
                                id="minViews"
                                type="number"
                                name="minViews"
                                placeholder="Min views"
                                value={filters.minViews}
                                onChange={handleInputChange}
                                min="0"
                                className="bg-[#111] border-[#333] focus:border-blue-600 transition-all duration-300"
                              />
                            </div>

                            <div className="space-y-2">
                              <label
                                htmlFor="sortBy"
                                className="text-sm text-gray-300 font-medium"
                              >
                                Sort By
                              </label>
                              <div className="relative">
                                <select
                                  id="sortBy"
                                  name="sortBy"
                                  value={filters.sortBy}
                                  onChange={handleInputChange}
                                  className="w-full bg-[#111] border border-[#333] focus:border-blue-600 p-2 rounded-md text-white appearance-none pr-8 transition-all duration-300"
                                >
                                  <option value="newest">
                                    Newest to Oldest
                                  </option>
                                  <option value="oldest">
                                    Oldest to Newest
                                  </option>
                                  <option value="a-z">A-Z</option>
                                  <option value="z-a">Z-A</option>
                                  <option value="rating">Highest Rated</option>
                                  <option value="downloads">
                                    Most Downloaded
                                  </option>
                                  <option value="least-downloaded">
                                    Least Downloaded
                                  </option>
                                  <option value="views">Most Viewed</option>
                                  <option value="least-viewed">
                                    Least Viewed
                                  </option>
                                </select>
                                <ArrowUpDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
                              </div>
                            </div>
                          </div>

                          <div className="mt-5">
                            <label className="text-sm text-gray-300 font-medium block mb-3">
                              Tags
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {tagOptions
                                .filter((tag) => tag !== "Overlays")
                                .map((tag) => (
                                  <motion.button
                                    key={tag}
                                    onClick={() => toggleTag(tag)}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`px-3 py-1.5 rounded-md border text-sm transition-all duration-200 cursor-pointer ${
                                      filters.tags.includes(tag)
                                        ? "bg-blue-600 text-white border-blue-700"
                                        : "bg-[#1a1a1a] border-[#333] text-white hover:bg-[#222]"
                                    }`}
                                  >
                                    {tag}
                                  </motion.button>
                                ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Recently Added Packs Section - Single Row with Pagination */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-[#111] border-[#333] border text-white p-6 sm:p-7 rounded-md shadow-xl mb-6"
                  >
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-blue-500" />
                        <h3 className="text-xl font-semibold text-blue-500">
                          Recently Added Packs
                        </h3>
                      </div>
                    </div>

                    {recentPacks.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <p>No recent packs found</p>
                      </div>
                    ) : (
                      <>
                        {renderRecentPacksRow(recentPacks)}
                        {totalRecentPages > 1 &&
                          renderPagination(
                            recentPage,
                            totalRecentPages,
                            setRecentPage
                          )}
                      </>
                    )}
                  </motion.div>

                  {loading && (
                    <div className="flex justify-center py-12">
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center"
                      >
                        <Loader2
                          className="animate-spin text-blue-500"
                          size={40}
                        />
                        <p className="mt-4 text-gray-400">Loading packs...</p>
                      </motion.div>
                    </div>
                  )}

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-900/20 border border-red-800/50 text-white p-4 rounded-md mb-6"
                    >
                      <p className="flex items-center">
                        <X className="h-4 w-4 mr-2 text-red-400" /> Error:{" "}
                        {error}
                      </p>
                      <Button
                        onClick={fetchPacks}
                        className="mt-2 bg-red-800/50 hover:bg-red-700/50 border border-red-700/50 px-4 py-1 rounded-md"
                      >
                        Retry
                      </Button>
                    </motion.div>
                  )}

                  {!loading && !error && (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-blue-500" />
                          <span>Results</span>
                          {packs.length > 0 && (
                            <Badge
                              variant="outline"
                              className="ml-2 bg-[#1a1a1a] text-gray-300 border-[#333]"
                            >
                              {packs.length}
                            </Badge>
                          )}
                        </h3>
                      </div>

                      <div className="max-h-[800px] overflow-y-auto pr-2 pb-4 custom-scrollbar">
                        {renderPackGrid(packs)}

                        {packs.length === 0 && !loading && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            className="text-center py-16 text-gray-400"
                          >
                            <SearchIcon className="h-12 w-12 mx-auto mb-4 text-gray-500 opacity-50" />
                            <p className="text-xl mb-2">No packs found</p>
                            <p>Try adjusting your filters or search terms</p>
                          </motion.div>
                        )}
                      </div>

                      {totalPages > 1 &&
                        renderPagination(
                          currentPage,
                          totalPages,
                          setCurrentPage
                        )}
                    </>
                  )}
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="md:col-span-1"
              >
                <PackLeaderboard />
                {/**
                <div className="mt-6 sticky top-6">
                  <div className="bg-[#111] border-[#333] border rounded-md p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Shuffle className="text-blue-500" size={20} />
                      <h3 className="text-lg font-semibold">Random Pack</h3>
                    </div>
                    <RandomPackGrid />
                  </div>
                </div> **/}
              </motion.div>
            </div>
          </TabsContent>

          <TabsContent value="overlays" className="mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-[#111] border-[#333] border text-white p-6 rounded-md shadow-xl"
            >
              <div className="flex items-center gap-2 mb-6">
                <Layers className="h-6 w-6 text-blue-500" />
                <h2 className="text-2xl font-bold text-blue-500">
                  Overlay Packs
                </h2>
              </div>

              {/* Search and filters for overlays */}
              <div className="mb-6">
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <div className="relative flex-grow">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search overlays..."
                      value={overlayFilters.name}
                      onChange={(e) =>
                        setOverlayFilters((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="pl-9 bg-[#1a1a1a] border-[#333] focus:border-blue-600 transition-all duration-300"
                    />
                  </div>
                  <Button
                    onClick={handleOverlaySearch}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Search
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowOverlayFilters(!showOverlayFilters)}
                    className="bg-[#1a1a1a] hover:bg-[#222] text-white border-[#333]"
                  >
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    {showOverlayFilters ? "Hide Filters" : "Show Filters"}
                  </Button>
                </div>

                <AnimatePresence>
                  {showOverlayFilters && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-[#1a1a1a] border border-[#333] rounded-md p-4 mb-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <label
                              htmlFor="overlay-author"
                              className="text-sm text-gray-300 font-medium"
                            >
                              Author
                            </label>
                            <Input
                              id="overlay-author"
                              name="author"
                              value={overlayFilters.author}
                              onChange={handleOverlayInputChange}
                              placeholder="Author name"
                              className="bg-[#111] border-[#333] focus:border-blue-600"
                            />
                          </div>

                          <div className="space-y-2">
                            <label
                              htmlFor="overlay-resolution"
                              className="text-sm text-gray-300 font-medium"
                            >
                              Resolution
                            </label>
                            <select
                              id="overlay-resolution"
                              name="resolution"
                              value={overlayFilters.resolution}
                              onChange={handleOverlayInputChange}
                              className="w-full bg-[#111] border border-[#333] focus:border-blue-600 p-2 rounded-md text-white"
                            >
                              <option value="">Any Resolution</option>
                              {resolutions.map((res) => (
                                <option key={res} value={res}>
                                  {res}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-2">
                            <label
                              htmlFor="overlay-minRating"
                              className="text-sm text-gray-300 font-medium"
                            >
                              Minimum Rating
                            </label>
                            <select
                              id="overlay-minRating"
                              name="minRating"
                              value={overlayFilters.minRating}
                              onChange={handleOverlayInputChange}
                              className="w-full bg-[#111] border border-[#333] focus:border-blue-600 p-2 rounded-md text-white"
                            >
                              <option value="">Any Rating</option>
                              {ratingOptions.map((rating) => (
                                <option key={rating} value={rating}>
                                  {rating}+ Stars
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-2">
                            <label
                              htmlFor="overlay-minDownloads"
                              className="text-sm text-gray-300 font-medium"
                            >
                              Minimum Downloads
                            </label>
                            <Input
                              id="overlay-minDownloads"
                              name="minDownloads"
                              type="number"
                              value={overlayFilters.minDownloads}
                              onChange={handleOverlayInputChange}
                              placeholder="Min downloads"
                              className="bg-[#111] border-[#333] focus:border-blue-600"
                            />
                          </div>

                          <div className="space-y-2">
                            <label
                              htmlFor="overlay-sortBy"
                              className="text-sm text-gray-300 font-medium"
                            >
                              Sort By
                            </label>
                            <select
                              id="overlay-sortBy"
                              name="sortBy"
                              value={overlayFilters.sortBy}
                              onChange={handleOverlayInputChange}
                              className="w-full bg-[#111] border border-[#333] focus:border-blue-600 p-2 rounded-md text-white"
                            >
                              <option value="newest">Newest First</option>
                              <option value="oldest">Oldest First</option>
                              <option value="rating">Highest Rated</option>
                              <option value="downloads">Most Downloads</option>
                              <option value="views">Most Views</option>
                              <option value="a-z">A-Z</option>
                              <option value="z-a">Z-A</option>
                            </select>
                          </div>
                        </div>

                        <div className="mt-4 flex justify-end">
                          <Button
                            variant="outline"
                            onClick={clearOverlayFilters}
                            className="bg-[#1a1a1a] hover:bg-[#222] text-white border-[#333] mr-2"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Clear Filters
                          </Button>
                          <Button
                            onClick={handleOverlaySearch}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            Apply Filters
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {overlaysLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="animate-spin text-blue-500" size={40} />
                </div>
              ) : overlayError ? (
                <div className="bg-red-900/20 border border-red-800/50 text-white p-4 rounded-md mb-6">
                  <p className="flex items-center">
                    <X className="h-4 w-4 mr-2 text-red-400" /> Error:{" "}
                    {overlayError}
                  </p>
                  <Button
                    onClick={fetchOverlayPacks}
                    className="mt-2 bg-red-800/50 hover:bg-red-700/50 border border-red-700/50 px-4 py-1 rounded-md"
                  >
                    Retry
                  </Button>
                </div>
              ) : overlayPacks.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-xl mb-2">No overlay packs found</p>
                  <p>Try adjusting your search terms or filters</p>
                </div>
              ) : (
                <>
                  {renderPackGrid(overlayPacks)}
                  {totalOverlayPages > 1 &&
                    renderPagination(
                      overlayPage,
                      totalOverlayPages,
                      setOverlayPage
                    )}
                </>
              )}
            </motion.div>
          </TabsContent>

          <TabsContent value="doomscroll" className="mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-[#111] border-[#333] border text-white p-6 rounded-md shadow-xl"
            >
              <div className="flex items-center gap-2 mb-6">
                <Grid3X3 className="h-6 w-6 text-blue-500" />
                <h2 className="text-2xl font-bold text-blue-500">
                  Doom Scrolling
                </h2>
              </div>

              <div className="bg-[#1a1a1a] border border-[#333] rounded-md p-4 mb-6">
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-500" />
                  <p className="text-gray-300">
                    Keep scrolling to discover more texture packs. New packs
                    will load automatically as you scroll down.
                  </p>
                </div>
              </div>

              {doomScrollPacks.length === 0 && doomScrollLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="animate-spin text-blue-500" size={40} />
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                  {doomScrollPacks.map((pack, index) => {
                    if (doomScrollPacks.length === index + 1) {
                      return (
                        <div ref={doomScrollRef} key={`${pack.id}-${index}`}>
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="bg-[#111] border border-[#333] rounded-md shadow-lg overflow-hidden hover:border-[#444] transition-all duration-300 cursor-pointer group"
                            onClick={() => handlePackClick(pack)}
                          >
                            <div className="relative pb-[100%] w-full overflow-hidden">
                              <img
                                src={pack.iconImage || "/placeholder.svg"}
                                alt={pack.name}
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    "/api/placeholder/400/400";
                                }}
                              />
                              {session?.user && (
                                <button
                                  onClick={(e) => toggleFavorite(e, pack.id)}
                                  className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded-md p-1.5 hover:bg-black/70 transition-colors z-10 transform hover:scale-110 duration-200"
                                >
                                  <Heart
                                    size={16}
                                    className={`${
                                      pack.isFavorited
                                        ? "fill-red-500 text-red-500"
                                        : "text-white"
                                    } transition-colors duration-300`}
                                  />
                                </button>
                              )}
                              {pack.additionalImages &&
                                pack.additionalImages.length > 0 && (
                                  <div className="absolute bottom-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-md">
                                    +{pack.additionalImages.length} images
                                  </div>
                                )}
                            </div>
                            <div className="p-3">
                              <h3 className="text-base font-medium mb-0.5 line-clamp-1 group-hover:text-white transition-colors duration-200">
                                {pack.name}
                              </h3>
                              <p className="text-gray-400 text-xs">
                                By {pack.author}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs bg-[#1a1a1a] text-gray-300 px-1.5 py-0.5 rounded-md">
                                  {pack.resolution}
                                </span>
                                <div className="flex items-center gap-1 text-xs text-gray-400">
                                  <Download size={10} />
                                  <span>
                                    {pack.downloadCount.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        </div>
                      );
                    } else {
                      return (
                        <motion.div
                          key={`${pack.id}-${index}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className="bg-[#111] border border-[#333] rounded-md shadow-lg overflow-hidden hover:border-[#444] transition-all duration-300 cursor-pointer group"
                          onClick={() => handlePackClick(pack)}
                        >
                          <div className="relative pb-[100%] w-full overflow-hidden">
                            <img
                              src={pack.iconImage || "/placeholder.svg"}
                              alt={pack.name}
                              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "/api/placeholder/400/400";
                              }}
                            />
                            {session?.user && (
                              <button
                                onClick={(e) => toggleFavorite(e, pack.id)}
                                className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded-md p-1.5 hover:bg-black/70 transition-colors z-10 transform hover:scale-110 duration-200"
                              >
                                <Heart
                                  size={16}
                                  className={`${
                                    pack.isFavorited
                                      ? "fill-red-500 text-red-500"
                                      : "text-white"
                                  } transition-colors duration-300`}
                                />
                              </button>
                            )}
                            {pack.additionalImages &&
                              pack.additionalImages.length > 0 && (
                                <div className="absolute bottom-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-md">
                                  +{pack.additionalImages.length} images
                                </div>
                              )}
                          </div>
                          <div className="p-3">
                            <h3 className="text-base font-medium mb-0.5 line-clamp-1 group-hover:text-white transition-colors duration-200">
                              {pack.name}
                            </h3>
                            <p className="text-gray-400 text-xs">
                              By {pack.author}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs bg-[#1a1a1a] text-gray-300 px-1.5 py-0.5 rounded-md">
                                {pack.resolution}
                              </span>
                              <div className="flex items-center gap-1 text-xs text-gray-400">
                                <Download size={10} />
                                <span>
                                  {pack.downloadCount.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    }
                  })}
                </div>
              )}

              {/* Infinite scroll loading indicator */}
              <div ref={doomScrollRef} className="py-8 text-center">
                {doomScrollLoading && doomScrollPacks.length > 0 && (
                  <Loader2
                    className="animate-spin text-blue-500 mx-auto"
                    size={30}
                  />
                )}
                {!hasMoreDoomScroll && doomScrollPacks.length > 0 && (
                  <p className="text-gray-400">You've seen all the packs!</p>
                )}
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Pack Details Dialog */}
      <Dialog
        open={!!selectedPack}
        onOpenChange={(open) => !open && setSelectedPack(null)}
      >
        <DialogContent className="sm:max-w-[700px] bg-[#111] border-[#333] text-white p-0 overflow-hidden rounded-md fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[90vw] max-h-[90vh]">
          {selectedPack && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col max-h-[90vh]"
            >
              <DialogTitle className="sr-only">
                {selectedPack.name} - Pack Details
              </DialogTitle>

              <div className="p-4 border-b border-[#333] flex justify-between items-center bg-[#111]">
                <h2 className="text-xl font-bold truncate">
                  {selectedPack.name}
                </h2>
                <DialogClose className="rounded-md p-1 hover:bg-[#222] transition-colors">
                  <X className="h-5 w-5" />
                  <span className="sr-only">Close</span>
                </DialogClose>
              </div>

              <div className="flex-grow overflow-y-auto custom-scrollbar">
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="w-full grid grid-cols-2 p-0 bg-[#1a1a1a]">
                    <TabsTrigger
                      value="details"
                      className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-none py-3"
                    >
                      Details
                    </TabsTrigger>
                    <TabsTrigger
                      value="comments"
                      className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-none py-3"
                    >
                      Comments
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="p-5">
                    <div className="relative mb-5 aspect-video bg-[#1a1a1a] rounded-md overflow-hidden shadow-lg">
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
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 rounded-md p-2 hover:bg-black/80 transition-colors"
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
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 rounded-md p-2 hover:bg-black/80 transition-colors"
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
                        <div className="bg-[#1a1a1a] rounded-md p-4 border border-[#333]">
                          <h3 className="font-semibold mb-3 text-blue-500">
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
                                      className="text-blue-500 hover:underline transition-colors"
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
                              <span className="bg-[#222] px-2 py-0.5 rounded-md text-xs">
                                {selectedPack.resolution}
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
                        <div className="bg-[#1a1a1a] rounded-md p-4 border border-[#333]">
                          <h3 className="font-semibold mb-3 text-blue-500">
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

                        <div className="bg-[#1a1a1a] rounded-md p-4 border border-[#333]">
                          <h3 className="font-semibold mb-3 text-blue-500">
                            Tags
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {selectedPack.tags.length > 0 ? (
                              selectedPack.tags.map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="outline"
                                  className="bg-[#222] hover:bg-[#333] transition-colors text-gray-200 border-[#444]"
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

              <div className="p-4 border-t border-[#333] flex gap-3 bg-[#111]">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-center flex-1 transition-colors duration-200 flex items-center justify-center gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(selectedPack.id, selectedPack.downloadUrl);
                  }}
                >
                  <Download size={18} />
                  Download
                </motion.button>
                {session?.user && (
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className={`py-2 px-4 rounded-md text-center transition-colors duration-200 flex items-center justify-center gap-2 ${
                      selectedPack.isFavorited
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : "bg-[#1a1a1a] hover:bg-[#222] text-white"
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

      {/* User Profile Dialog */}
      <Dialog open={showUserProfile} onOpenChange={setShowUserProfile}>
        <DialogContent className="sm:max-w-[500px] bg-[#111] border-[#333] text-white rounded-md fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[90vw] max-h-[90vh]">
          {selectedUser && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <DialogTitle className="text-xl font-bold mb-4 text-blue-500">
                {selectedUser.username}'s Profile
              </DialogTitle>

              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 ring-2 ring-offset-2 ring-offset-[#111] ring-blue-500/30">
                    <AvatarFallback className="text-xl bg-gradient-to-br from-blue-600 to-purple-600">
                      {selectedUser.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <h3 className="text-lg font-semibold">
                      {selectedUser.username}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant={
                          selectedUser.role === "ADMIN"
                            ? "destructive"
                            : "secondary"
                        }
                        className={
                          selectedUser.role === "ADMIN"
                            ? "bg-red-600"
                            : "bg-blue-600"
                        }
                      >
                        {selectedUser.role}
                      </Badge>
                      {selectedUser.isVerified && (
                        <Badge variant="default" className="bg-green-600">
                          Verified
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 block mt-1">
                      Member since{" "}
                      {new Date(selectedUser.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="bg-[#1a1a1a] rounded-md p-4 border border-[#333]">
                  {selectedUser.bio ? (
                    <div>
                      <h4 className="text-sm font-medium text-blue-500 mb-2">
                        Bio
                      </h4>
                      <p className="text-sm text-gray-200">
                        {selectedUser.bio}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">
                      No bio provided
                    </p>
                  )}
                </div>

                <div className="pt-2 flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors duration-200"
                    onClick={() => {
                      router.push(`/profile/${selectedUser.username}`);
                      setShowUserProfile(false);
                    }}
                  >
                    View Full Profile
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Search;
