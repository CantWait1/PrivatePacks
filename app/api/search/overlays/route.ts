import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const {
      page = 1,
      limit = 24,
      name = "",
      author = "",
      resolution = "",
      minRating = 0,
      minDownloads = 0,
      sortBy = "newest",
    } = await req.json();

    const session = await getServerSession(authOptions);

    // Get user favorites if logged in
    let userFavorites: number[] = [];
    if (session?.user) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email as string },
        include: { favorites: true },
      });

      if (user?.favorites) {
        userFavorites = user.favorites.map((fav) => fav.packId);
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      tags: {
        has: "Overlays",
      },
    };

    // Add filters if provided
    if (name) {
      where.name = {
        contains: name,
        mode: "insensitive",
      };
    }

    if (author) {
      where.author = {
        contains: author,
        mode: "insensitive",
      };
    }

    if (resolution) {
      where.resolution = resolution;
    }

    if (minDownloads > 0) {
      where.downloadCount = {
        gte: minDownloads,
      };
    }

    // Determine sort order
    let orderBy: any = {};

    switch (sortBy) {
      case "newest":
        orderBy = { createdAt: "desc" };
        break;
      case "oldest":
        orderBy = { createdAt: "asc" };
        break;
      case "a-z":
        orderBy = { name: "asc" };
        break;
      case "z-a":
        orderBy = { name: "desc" };
        break;
      case "downloads":
        orderBy = { downloadCount: "desc" };
        break;
      case "views":
        orderBy = { viewCount: "desc" };
        break;
      default:
        orderBy = { createdAt: "desc" };
    }

    // Get total count for pagination
    const totalCount = await prisma.pack.count({ where });

    // Get overlay packs
    const packs = await prisma.pack.findMany({
      where,
      include: {
        ratings: true,
        favorites: session?.user
          ? {
              where: {
                user: {
                  email: session.user.email as string,
                },
              },
            }
          : false,
      },
      orderBy,
      skip,
      take: limit,
    });

    // Filter by rating after fetching (since we need to calculate average rating)
    const packsWithAvgRating = packs.map((pack) => {
      const ratings = pack.ratings || [];
      const totalRating = ratings.reduce(
        (sum, rating) => sum + rating.value,
        0
      );
      const averageRating =
        ratings.length > 0 ? totalRating / ratings.length : 0;

      // Check if this pack is favorited by the current user
      const isFavorited = session?.user
        ? pack.favorites && pack.favorites.length > 0
        : false;

      const { ratings: _, favorites: __, ...packWithoutRatings } = pack;

      return {
        ...packWithoutRatings,
        averageRating: Number.parseFloat(averageRating.toFixed(1)),
        ratingCount: ratings.length,
        isFavorited,
      };
    });

    // Apply minimum rating filter if provided
    const filteredPacks =
      minRating > 0
        ? packsWithAvgRating.filter((pack) => pack.averageRating >= minRating)
        : packsWithAvgRating;

    return NextResponse.json({
      packs: filteredPacks,
      total: totalCount,
    });
  } catch (error) {
    console.error("Overlay packs query failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch overlay packs" },
      { status: 500 }
    );
  }
}
