"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { Loader2, TrophyIcon } from "lucide-react";
import { nexaLight } from "@/fonts/fonts";
import StarRating from "./StarRating";

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

const PackLeaderboard: React.FC = () => {
  const [topPacks, setTopPacks] = useState<LeaderboardPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"rating" | "downloads" | "views">(
    "rating"
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
    .slice(0, 15);

  return (
    <div
      className={`bg-neutral-900 rounded-xl p-4 border border-neutral-800 ${nexaLight.className}`}
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
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-800 transition-colors"
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
    </div>
  );
};

export default PackLeaderboard;
