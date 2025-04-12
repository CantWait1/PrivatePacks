// app/api/favorites/route.ts
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
        pack: true,
      },
    });

    // Return just the pack IDs for simplicity
    return NextResponse.json(
      favorites.map((fav) => ({
        packId: fav.packId,
        createdAt: fav.createdAt,
      }))
    );
  } catch (error) {
    console.error("Get favorites failed:", error);
    return NextResponse.json(
      { error: "Failed to get favorites" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to favorite a pack" },
        { status: 401 }
      );
    }

    const { packId } = await req.json();

    if (!packId) {
      return NextResponse.json(
        { error: "Pack ID is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if the favorite already exists
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        packId_userId: {
          packId: Number.parseInt(packId),
          userId: user.id,
        },
      },
    });

    if (existingFavorite) {
      // Remove the favorite
      await prisma.favorite.delete({
        where: {
          packId_userId: {
            packId: Number.parseInt(packId),
            userId: user.id,
          },
        },
      });

      return NextResponse.json({ action: "removed" });
    } else {
      // Add the favorite
      await prisma.favorite.create({
        data: {
          packId: Number.parseInt(packId),
          userId: user.id,
        },
      });

      return NextResponse.json({ action: "added" });
    }
  } catch (error) {
    console.error("Favorite toggle failed:", error);
    return NextResponse.json(
      { error: "Failed to toggle favorite" },
      { status: 500 }
    );
  }
}
