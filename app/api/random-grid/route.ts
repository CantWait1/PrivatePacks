import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { limit = 12 } = await req.json();
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

    // Get total count of packs
    const totalCount = await prisma.pack.count();

    // Get random packs by using skip with a random offset
    const randomSkip = Math.max(
      0,
      Math.floor(Math.random() * (totalCount - limit))
    );

    const packs = await prisma.pack.findMany({
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
      skip: randomSkip,
      take: limit,
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
      total: totalCount,
    });
  } catch (error) {
    console.error("Random grid packs query failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch random grid packs" },
      { status: 500 }
    );
  }
}
