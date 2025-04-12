// app/api/leaderboard/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const packs = await prisma.pack.findMany({
      include: {
        ratings: true,
      },
      where: {
        OR: [
          { ratings: { some: {} } },
          { downloadCount: { gt: 0 } },
          { viewCount: { gt: 0 } },
        ],
      },
      take: 20,
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
        downloadCount: pack.downloadCount,
        viewCount: pack.viewCount,
        averageRating: Number.parseFloat(averageRating.toFixed(1)),
        ratingCount: ratings.length,
      };
    });

    return NextResponse.json(packsWithStats);
  } catch (error) {
    console.error("Leaderboard query failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
