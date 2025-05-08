import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to remove a rating" },
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

    // Find the rating
    const rating = await prisma.rating.findUnique({
      where: {
        packId_userId: {
          packId: Number.parseInt(packId),
          userId: user.id,
        },
      },
    });

    if (!rating) {
      return NextResponse.json({ error: "Rating not found" }, { status: 404 });
    }

    // Delete the rating
    await prisma.rating.delete({
      where: {
        packId_userId: {
          packId: Number.parseInt(packId),
          userId: user.id,
        },
      },
    });

    // Get updated ratings
    const ratings = await prisma.rating.findMany({
      where: { packId: Number.parseInt(packId) },
    });

    const totalRating = ratings.reduce((sum, r) => sum + r.value, 0);
    const averageRating = ratings.length > 0 ? totalRating / ratings.length : 0;

    return NextResponse.json({
      success: true,
      averageRating: Number.parseFloat(averageRating.toFixed(1)),
      ratingCount: ratings.length,
    });
  } catch (error) {
    console.error("Rating removal failed:", error);
    return NextResponse.json(
      { error: "Failed to remove rating" },
      { status: 500 }
    );
  }
}
