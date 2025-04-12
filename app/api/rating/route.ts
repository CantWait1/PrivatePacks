// app/api/rating/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to rate a pack" },
        { status: 401 }
      );
    }

    const { packId, rating } = await req.json();

    if (!packId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Valid pack ID and rating (1-5) are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.rating.upsert({
      where: {
        packId_userId: {
          packId: parseInt(packId),
          userId: user.id,
        },
      },
      update: {
        value: parseInt(rating),
      },
      create: {
        packId: parseInt(packId),
        userId: user.id,
        value: parseInt(rating),
      },
    });

    const ratings = await prisma.rating.findMany({
      where: { packId: parseInt(packId) },
    });

    const totalRating = ratings.reduce((sum, r) => sum + r.value, 0);
    const averageRating = ratings.length > 0 ? totalRating / ratings.length : 0;

    return NextResponse.json({
      success: true,
      averageRating: parseFloat(averageRating.toFixed(1)),
      ratingCount: ratings.length,
    });
  } catch (error) {
    console.error("Rating failed:", error);
    return NextResponse.json(
      { error: "Failed to submit rating" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const packId = url.searchParams.get("packId");

    if (!packId) {
      return NextResponse.json(
        { error: "Pack ID is required" },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    let userRating = null;

    if (session?.user) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email as string },
      });

      if (user) {
        const rating = await prisma.rating.findUnique({
          where: {
            packId_userId: {
              packId: parseInt(packId),
              userId: user.id,
            },
          },
        });

        if (rating) {
          userRating = rating.value;
        }
      }
    }

    const ratings = await prisma.rating.findMany({
      where: { packId: parseInt(packId) },
    });

    const totalRating = ratings.reduce((sum, r) => sum + r.value, 0);
    const averageRating = ratings.length > 0 ? totalRating / ratings.length : 0;

    return NextResponse.json({
      averageRating: parseFloat(averageRating.toFixed(1)),
      ratingCount: ratings.length,
      userRating,
    });
  } catch (error) {
    console.error("Get rating failed:", error);
    return NextResponse.json(
      { error: "Failed to get ratings" },
      { status: 500 }
    );
  }
}
