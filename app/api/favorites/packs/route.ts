import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to view favorites" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all favorites with pack details
    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id },
      include: {
        pack: {
          include: {
            ratings: true,
          },
        },
      },
    });

    // Format the packs with average rating
    const packs = favorites.map((fav) => {
      const pack = fav.pack;
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
        resolution: pack.resolution,
        iconImage: pack.iconImage,
        downloadCount: pack.downloadCount,
        viewCount: pack.viewCount,
        averageRating: Number.parseFloat(averageRating.toFixed(1)),
        ratingCount: ratings.length,
        createdAt: pack.createdAt,
      };
    });

    return NextResponse.json({ packs });
  } catch (error) {
    console.error("Get favorite packs failed:", error);
    return NextResponse.json(
      { error: "Failed to get favorite packs" },
      { status: 500 }
    );
  }
}
