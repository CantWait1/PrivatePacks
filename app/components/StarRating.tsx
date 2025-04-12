"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  count?: number;
  size?: number;
  editable?: boolean;
  packId?: number;
  onRatingChange?: (newRating: number) => void;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  count,
  size = 18,
  editable = false,
  packId,
  onRatingChange,
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch user's existing rating when component mounts
  useEffect(() => {
    if (editable && packId) {
      const fetchUserRating = async () => {
        try {
          const response = await fetch(`/api/rating?packId=${packId}`);
          if (response.ok) {
            const data = await response.json();
            if (data.userRating) {
              setUserRating(data.userRating);
            }
          }
        } catch (error) {
          console.error("Error fetching user rating:", error);
        }
      };

      fetchUserRating();
    }
  }, [editable, packId]);

  const handleRatingClick = async (value: number) => {
    if (!editable || !onRatingChange || !packId || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/rating", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId, rating: value }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit rating");
      }

      const data = await response.json();
      setUserRating(value);
      onRatingChange(value);
    } catch (error) {
      console.error("Error submitting rating:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((value) => {
            // Determine if star should be filled
            const filled =
              hoverRating > 0
                ? value <= hoverRating
                : userRating
                ? value <= userRating
                : value <= Math.round(rating);

            return (
              <Star
                key={value}
                size={size}
                className={`${
                  filled ? "text-yellow-400 fill-yellow-400" : "text-gray-500"
                } ${editable ? "cursor-pointer" : ""} ${
                  isSubmitting ? "opacity-50" : ""
                }`}
                onClick={() => editable && handleRatingClick(value)}
                onMouseEnter={() => editable && setHoverRating(value)}
                onMouseLeave={() => editable && setHoverRating(0)}
              />
            );
          })}
        </div>
        {count !== undefined && (
          <span className="text-xs text-gray-400 ml-1">({count})</span>
        )}
      </div>

      {editable && userRating && (
        <span className="text-xs text-green-500 mt-0.5">
          Your rating: {userRating} {userRating === 1 ? "star" : "stars"}
        </span>
      )}

      {editable && !userRating && (
        <span className="text-xs text-gray-400 mt-0.5">Click to rate</span>
      )}
    </div>
  );
};

export default StarRating;
