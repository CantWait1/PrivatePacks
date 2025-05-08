// app/api/leaderboard/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic"; // Prevents Next.js from caching this route

export async function GET(req: NextRequest) {
  try {
    // First, fetch all packs to ensure we don't miss any new ones
    const packs = await prisma.pack.findMany({
      include: {
        ratings: true,
      },
      orderBy: [
        { ratings: { _count: "desc" } },
        { downloadCount: "desc" },
        { viewCount: "desc" },
        { createdAt: "desc" }, // This ensures newer packs get priority if other metrics are equal
      ],
      take: 100, // Fetch more to ensure we have enough for filtering
    });

    const packsWithStats = packs.map((pack) => {
      const ratings = pack.ratings || [];
      const totalRating = ratings.reduce(
        (sum, rating) => sum + rating.value,
        0
      );
      const averageRating =
        ratings.length > 0 ? totalRating / ratings.length : 0;

      return {
        id: pack.id,
        name: pack.name,
        author: pack.author,
        iconImage: pack.iconImage,
        downloadCount: pack.downloadCount || 0,
        viewCount: pack.viewCount || 0,
        averageRating: Number.parseFloat(averageRating.toFixed(1)),
        ratingCount: ratings.length,
      };
    });

    // Filter out any packs with no activity at all
    const activePacks = packsWithStats.filter(
      (pack) =>
        pack.ratingCount > 0 || pack.downloadCount > 0 || pack.viewCount > 0
    );

    // If we have too few active packs, include some newer ones anyway
    const topPacks =
      activePacks.length >= 20
        ? activePacks.slice(0, 20)
        : [
            ...activePacks,
            ...packsWithStats
              .filter((p) => !activePacks.some((ap) => ap.id === p.id))
              .slice(0, 20 - activePacks.length),
          ];

    return NextResponse.json(topPacks);
  } catch (error) {
    console.error("Leaderboard query failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
