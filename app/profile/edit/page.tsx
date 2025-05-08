"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import { nexaLight } from "@/fonts/fonts";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// Update the import to use the constants file
import { USERNAME_COLORS } from "@/app/constants/colors";

interface UserProfile {
  id: number;
  username: string;
  bio?: string;
  role: string;
  createdAt: string;
  colorPreference?: number;
}

export default function EditProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  // Add state for color selection
  const [selectedColor, setSelectedColor] = useState<number>(0);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/sign-in");
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/users/profile?username=${encodeURIComponent(
            session?.user?.username || ""
          )}`
        );

        if (!res.ok) {
          throw new Error("Failed to fetch user profile");
        }

        const data = await res.json();
        setProfile(data);
        setBio(data.bio || "");
        setSelectedColor(data.colorPreference || 0); // Set the color preference
      } catch (error) {
        console.error("Error fetching profile:", error);
        setError("Failed to load user profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [session, status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Update bio
      const bioRes = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bio }),
      });

      if (!bioRes.ok) {
        const data = await bioRes.json();
        throw new Error(data.error || "Failed to update profile");
      }

      // Update color preference
      const colorRes = await fetch("/api/users/profile/color", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ colorIndex: selectedColor }),
      });

      if (!colorRes.ok) {
        const data = await colorRes.json();
        throw new Error(data.error || "Failed to update color preference");
      }

      setSuccess("Profile updated successfully");

      // Update the profile state
      const data = await bioRes.json();
      setProfile(data);
    } catch (error) {
      console.error("Error updating profile:", error);
      setError(
        error instanceof Error ? error.message : "Failed to update profile"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="animate-spin text-white" size={32} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-900/50 text-white p-6 rounded-xl">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error || "Failed to load profile"}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push("/")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto px-4 py-8 ${nexaLight.className}`}>
      <Button variant="outline" className="mb-6" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <div className="bg-neutral-800/40 border-white border-solid border-[1px] text-white p-6 rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 bg-green-900 border-green-800">
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start mb-6">
          <Avatar className="h-24 w-24">
            <AvatarFallback className="text-3xl">
              {profile.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
              <h2
                className={`text-xl font-bold ${USERNAME_COLORS[selectedColor]}`}
              >
                {profile.username}
              </h2>
              <Badge
                variant={profile.role === "ADMIN" ? "destructive" : "secondary"}
                className="md:ml-2"
              >
                {profile.role}
              </Badge>
            </div>

            <p className="text-gray-400">
              Member since {new Date(profile.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="bio" className="block text-sm font-medium mb-2">
                Bio
              </label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell others about yourself..."
                className="bg-neutral-900 border-neutral-700 focus:border-neutral-600"
                rows={5}
                maxLength={500}
              />
              <p className="text-xs text-gray-400 mt-1">
                {bio.length}/500 characters
              </p>
            </div>
          </div>
          {/* Add the color selection UI to the form */}
          <div className="space-y-4 mt-6">
            <h3 className="text-lg font-semibold">Username Color</h3>
            <div className="flex flex-wrap gap-3">
              {USERNAME_COLORS.map((colorClass, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedColor(index)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    selectedColor === index
                      ? "border-white"
                      : "border-transparent"
                  }`}
                >
                  <span className={`text-lg font-bold ${colorClass}`}>A</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400">
              Select a color for your username as it appears across the site
            </p>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
