"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, Heart, Star, ArrowLeft } from "lucide-react";
import { nexaLight } from "@/fonts/fonts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { motion } from "framer-motion";
import { USERNAME_COLORS } from "@/app/constants/colors";

interface UserProfile {
  id: number;
  username: string;
  bio?: string;
  role: string;
  createdAt: string;
  isVerified?: boolean;
  colorPreference?: number;
}

interface Pack {
  id: number;
  name: string;
  author: string;
  resolution: string;
  iconImage: string;
  downloadCount: number;
  viewCount: number;
  averageRating: number;
  ratingCount: number;
  userRating?: number;
}

export default function UserProfilePage() {
  const { username } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [favoritesPacks, setFavoritesPacks] = useState<Pack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [ratedPacks, setRatedPacks] = useState<Pack[]>([]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 70,
        damping: 10,
      },
    },
    hover: {
      y: -8,
      boxShadow: "0px 10px 20px rgba(0,0,0,0.2)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10,
      },
    },
  };

  const handleBackClick = () => {
    const referrer = document.referrer;
    if (
      referrer &&
      (referrer.includes("/") || referrer.endsWith(window.location.hostname))
    ) {
      router.push("/");
    } else {
      router.back();
    }
  };

  useEffect(() => {
    if (status === "loading") return;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        console.log(`Fetching profile for username: ${username}`);

        const res = await fetch(
          `/api/users/profile?username=${encodeURIComponent(
            username as string
          )}`
        );
        console.log(`Response status: ${res.status}`);

        if (!res.ok) {
          const errorData = await res
            .json()
            .catch(() => ({ error: "Failed to parse error response" }));
          console.error("Profile fetch error:", errorData);
          throw new Error(errorData.error || "Failed to fetch user profile");
        }

        const data = await res.json();
        console.log("Profile data received:", data);
        setProfile(data);

        setIsOwnProfile(session?.user?.username === data.username);

        if (session?.user?.username === data.username) {
          fetchFavorites();
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load user profile"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username, session, status]);

  const fetchFavorites = async () => {
    try {
      const favRes = await fetch("/api/favorites/packs");
      if (!favRes.ok) {
        throw new Error("Failed to fetch favorite packs");
      }
      const favData = await favRes.json();
      setFavoritesPacks(favData.packs || []);

      const ratedRes = await fetch("/api/rating/user");
      if (!ratedRes.ok) {
        throw new Error("Failed to fetch rated packs");
      }
      const ratedData = await ratedRes.json();
      setRatedPacks(ratedData.packs || []);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const handleViewPack = (packId: number) => {
    localStorage.setItem("viewPackId", packId.toString());
    router.push("/search");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            repeat: Infinity,
            repeatType: "reverse",
            duration: 1.5,
          }}
        >
          <Loader2 className="animate-spin text-white" size={32} />
        </motion.div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <motion.div
        className="max-w-4xl mx-auto px-4 py-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 12 }}
      >
        <div className="bg-red-900/50 text-white p-6 rounded-xl backdrop-blur-md border border-red-800/50">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error || "User not found"}</p>
          <Button
            variant="outline"
            className="mt-4 hover:bg-red-800/30 transition-all duration-300"
            onClick={() => router.push("/")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`max-w-4xl mx-auto px-4 py-8 ${nexaLight.className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <Button
          variant="outline"
          className="mb-6 hover:bg-neutral-800/50 transition-all duration-300"
          onClick={handleBackClick}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="bg-neutral-800/40 border-white/20 border-solid border-[1px] text-white p-6 rounded-2xl shadow-lg mb-6 backdrop-blur-sm hover:border-white/30 transition-all duration-300"
      >
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
          <motion.div
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <Avatar className="h-24 w-24 md:h-32 md:w-32 ring-2 ring-white/30 ring-offset-2 ring-offset-neutral-900">
              <AvatarFallback className="text-3xl bg-gradient-to-br from-neutral-700 to-neutral-900">
                {profile.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </motion.div>

          <div className="flex-1 text-center md:text-left">
            <motion.div
              className="flex flex-col md:flex-row md:items-center gap-2 mb-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                type: "spring",
                stiffness: 100,
                damping: 12,
                delay: 0.2,
              }}
            >
              <h1
                className={`text-3xl font-bold ${
                  profile.colorPreference !== undefined
                    ? USERNAME_COLORS[profile.colorPreference]
                    : USERNAME_COLORS[0]
                } drop-shadow-md`}
              >
                {profile.username}
              </h1>
              <div className="flex gap-2">
                <Badge
                  variant={
                    profile.role === "ADMIN" ? "destructive" : "secondary"
                  }
                  className="md:ml-2 hover:brightness-110 transition-all duration-300"
                >
                  {profile.role}
                </Badge>
                {profile.isVerified && (
                  <Badge
                    variant="default"
                    className="bg-green-600 md:ml-2 hover:bg-green-500 transition-all duration-300"
                  >
                    Verified
                  </Badge>
                )}
              </div>
            </motion.div>

            <motion.p
              className="text-gray-400 mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Member since {new Date(profile.createdAt).toLocaleDateString()}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {profile.bio ? (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">Bio</h3>
                  <p className="text-gray-200">{profile.bio}</p>
                </div>
              ) : (
                <p className="text-gray-400 italic mb-4">No bio provided</p>
              )}
            </motion.div>

            {isOwnProfile && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
              >
                <Button
                  onClick={() => router.push("/profile/edit")}
                  className="mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all duration-300"
                >
                  Edit Profile
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {isOwnProfile && (
        <motion.div
          variants={itemVariants}
          className="bg-neutral-800/40 border-white/20 border-solid border-[1px] text-white p-6 rounded-2xl shadow-lg backdrop-blur-sm hover:border-white/30 transition-all duration-300"
        >
          <Tabs defaultValue="favorites">
            <TabsList className="mb-6 bg-neutral-700/50 backdrop-blur-sm">
              <TabsTrigger
                value="favorites"
                className="flex items-center gap-2 data-[state=active]:bg-neutral-600 data-[state=active]:text-white"
              >
                <Heart className="h-4 w-4" /> Favorites
              </TabsTrigger>
              <TabsTrigger
                value="ratings"
                className="flex items-center gap-2 data-[state=active]:bg-neutral-600 data-[state=active]:text-white"
              >
                <Star className="h-4 w-4" /> Ratings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="favorites">
              <motion.h2
                className="text-xl font-semibold mb-4"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                Your Favorite Packs
              </motion.h2>

              {favoritesPacks.length === 0 ? (
                <motion.p
                  className="text-gray-400 text-center py-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  You haven't favorited any packs yet
                </motion.p>
              ) : (
                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {favoritesPacks.map((pack, index) => (
                    <motion.div
                      key={pack.id}
                      variants={cardVariants}
                      whileHover="hover"
                      custom={index}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="bg-neutral-900/70 border-neutral-800/50 backdrop-blur-sm hover:bg-neutral-800/70 transition-all duration-300">
                        <CardHeader className="pb-2">
                          <div className="aspect-square w-full relative rounded-md overflow-hidden mb-2">
                            <img
                              src={pack.iconImage || "/placeholder.svg"}
                              alt={pack.name}
                              className="object-cover w-full h-full transition-transform duration-700 hover:scale-110"
                            />
                          </div>
                          <CardTitle className="text-lg text-white">
                            {pack.name}
                          </CardTitle>
                          <CardDescription className="text-gray-300">
                            By {pack.author}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <div className="flex justify-between text-sm text-gray-400">
                            <span>{pack.resolution}</span>
                            <span>{pack.downloadCount} downloads</span>
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full hover:bg-white/10 transition-all duration-300"
                            onClick={() => handleViewPack(pack.id)}
                          >
                            View Pack
                          </Button>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </TabsContent>

            <TabsContent value="ratings">
              <motion.h2
                className="text-xl font-semibold mb-4"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                Your Rated Packs
              </motion.h2>

              {ratedPacks.length === 0 ? (
                <motion.p
                  className="text-gray-400 text-center py-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  You haven't rated any packs yet
                </motion.p>
              ) : (
                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {ratedPacks.map((pack, index) => (
                    <motion.div
                      key={pack.id}
                      variants={cardVariants}
                      whileHover="hover"
                      custom={index}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="bg-neutral-900/70 border-neutral-800/50 backdrop-blur-sm hover:bg-neutral-800/70 transition-all duration-300">
                        <CardHeader className="pb-2">
                          <div className="aspect-square w-full relative rounded-md overflow-hidden mb-2">
                            <img
                              src={pack.iconImage || "/placeholder.svg"}
                              alt={pack.name}
                              className="object-cover w-full h-full transition-transform duration-700 hover:scale-110"
                            />
                          </div>
                          <CardTitle className="text-lg text-white">
                            {pack.name}
                          </CardTitle>
                          <CardDescription className="text-gray-300">
                            By {pack.author}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <div className="flex justify-between text-sm text-gray-400">
                            <span>{pack.resolution}</span>
                            <motion.span
                              initial={{ scale: 1 }}
                              whileHover={{ scale: 1.1 }}
                              className="font-semibold text-amber-400"
                            >
                              Your rating: {pack.userRating}/5
                            </motion.span>
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full hover:bg-white/10 transition-all duration-300"
                            onClick={() => handleViewPack(pack.id)}
                          >
                            View Pack
                          </Button>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      )}
    </motion.div>
  );
}
