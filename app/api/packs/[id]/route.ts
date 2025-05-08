import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Make params a Promise if it isn't already
    const resolvedParams = Promise.resolve(params);
    const { id: idParam } = await resolvedParams;

    if (!idParam) {
      return NextResponse.json({ error: "Missing pack ID" }, { status: 400 });
    }

    const id = Number.parseInt(idParam, 10);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid pack ID" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);

    // Get the pack with all its details
    const pack = await prisma.pack.findUnique({
      where: { id },
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

    if (!pack) {
      return NextResponse.json({ error: "Pack not found" }, { status: 404 });
    }

    // Calculate average rating
    const ratings = pack.ratings || [];
    const totalRating = ratings.reduce((sum, rating) => sum + rating.value, 0);
    const averageRating = ratings.length > 0 ? totalRating / ratings.length : 0;

    // Check if this pack is favorited by the current user
    const isFavorited = session?.user
      ? pack.favorites && pack.favorites.length > 0
      : false;

    const { ratings: _, favorites: __, ...packWithoutRatings } = pack;

    const formattedPack = {
      ...packWithoutRatings,
      averageRating: Number.parseFloat(averageRating.toFixed(1)),
      ratingCount: ratings.length,
      isFavorited,
    };

    return NextResponse.json({ pack: formattedPack });
  } catch (error) {
    console.error("Error fetching pack:", error);
    return NextResponse.json(
      { error: "Failed to fetch pack" },
      { status: 500 }
    );
  }
}
