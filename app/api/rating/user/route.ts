import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to view your ratings" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all ratings with pack details
    const ratings = await prisma.rating.findMany({
      where: { userId: user.id },
      include: {
        pack: true,
      },
    });

    // Format the packs with rating information
    const packs = ratings.map((rating) => {
      const pack = rating.pack;

      return {
        id: pack.id,
        name: pack.name,
        author: pack.author,
        resolution: pack.resolution,
        iconImage: pack.iconImage,
        downloadCount: pack.downloadCount,
        viewCount: pack.viewCount,
        userRating: rating.value, // Include the user's rating
        createdAt: pack.createdAt,
      };
    });

    return NextResponse.json({ packs });
  } catch (error) {
    console.error("Get user ratings failed:", error);
    return NextResponse.json(
      { error: "Failed to get user ratings" },
      { status: 500 }
    );
  }
}
