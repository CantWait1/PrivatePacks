// app/api/views/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function PUT(req: NextRequest) {
  try {
    const { packId } = await req.json();

    if (!packId) {
      return NextResponse.json(
        { error: "Pack ID is required" },
        { status: 400 }
      );
    }

    // Get the current session to track views by user
    const session = await getServerSession(authOptions);

    // Check if this user has already viewed this pack
    if (session?.user) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email as string },
      });

      if (user) {
        // Check if we have a record of this view in the last 24 hours
        const recentView = await prisma.view.findFirst({
          where: {
            packId: Number.parseInt(packId),
            userId: user.id,
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
          },
        });

        if (recentView) {
          // User has already viewed this pack recently, don't increment
          return NextResponse.json({
            success: true,
            viewCount:
              (
                await prisma.pack.findUnique({
                  where: { id: Number.parseInt(packId) },
                })
              )?.viewCount || 0,
            alreadyViewed: true,
          });
        }

        // Record this view
        await prisma.view.create({
          data: {
            packId: Number.parseInt(packId),
            userId: user.id,
          },
        });
      }
    }

    // Increment the view count
    const updatedPack = await prisma.pack.update({
      where: { id: Number.parseInt(packId) },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      viewCount: updatedPack.viewCount,
    });
  } catch (error) {
    console.error("Failed to increment view count:", error);
    return NextResponse.json(
      { error: "Failed to update view count" },
      { status: 500 }
    );
  }
}
