import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { page = 1, limit = 24 } = await req.json();
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

    // Get random packs - using a more random approach
    // First get the total count
    const totalCount = await prisma.pack.count();

    // Generate random offset to get different results each time
    // But make sure we don't exceed the total count
    const randomOffset = Math.floor(
      Math.random() * Math.max(1, totalCount - limit)
    );

    // Use the random offset to get a different set of packs each time
    const packs = await prisma.pack.findMany({
      take: limit,
      skip: randomOffset,
      orderBy: {
        // Add additional randomness with a secondary sort
        id: Math.random() > 0.5 ? "asc" : "desc",
      },
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
    });

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

    return NextResponse.json({
      packs: packsWithAvgRating,
    });
  } catch (error) {
    console.error("Random packs query failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch random packs" },
      { status: 500 }
    );
  }
}
