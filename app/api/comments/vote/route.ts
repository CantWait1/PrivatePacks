import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { rateLimit } from "@/middleware/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "User is not authenticated" },
        { status: 401 }
      );
    }

    // Rate limiting
    const ip = request.headers.get("x-forwarded-for") || "anonymous";
    const rateLimitOptions = { limit: 20, window: 60 }; // Allow more votes than comments
    const { success } = await rateLimit(request, rateLimitOptions);

    if (!success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    const { commentId, voteType } = await request.json();

    if (!commentId) {
      return NextResponse.json(
        { error: "Comment ID is required" },
        { status: 400 }
      );
    }

    if (voteType !== "up" && voteType !== "down" && voteType !== "none") {
      return NextResponse.json({ error: "Invalid vote type" }, { status: 400 });
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if the comment exists
    const comment = await prisma.comment.findUnique({
      where: { id: Number(commentId) },
      include: {
        upvotes: {
          where: { userId: user.id },
        },
        downvotes: {
          where: { userId: user.id },
        },
      },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Handle the vote
    const hasUpvoted = comment.upvotes.length > 0;
    const hasDownvoted = comment.downvotes.length > 0;

    // Start a transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // Remove existing votes if any
      if (hasUpvoted) {
        await tx.commentUpvote.delete({
          where: {
            commentId_userId: {
              commentId: Number(commentId),
              userId: user.id,
            },
          },
        });
      }

      if (hasDownvoted) {
        await tx.commentDownvote.delete({
          where: {
            commentId_userId: {
              commentId: Number(commentId),
              userId: user.id,
            },
          },
        });
      }

      // Add new vote if not "none"
      if (voteType === "up") {
        await tx.commentUpvote.create({
          data: {
            commentId: Number(commentId),
            userId: user.id,
          },
        });
      } else if (voteType === "down") {
        await tx.commentDownvote.create({
          data: {
            commentId: Number(commentId),
            userId: user.id,
          },
        });
      }
    });

    // Get updated vote counts
    const updatedComment = await prisma.comment.findUnique({
      where: { id: Number(commentId) },
      include: {
        _count: {
          select: {
            upvotes: true,
            downvotes: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      commentId,
      upvoteCount: updatedComment?._count.upvotes || 0,
      downvoteCount: updatedComment?._count.downvotes || 0,
      userVote: voteType === "none" ? null : voteType,
    });
  } catch (error) {
    console.error("Error voting on comment:", error);
    return NextResponse.json(
      { error: "Failed to vote on comment" },
      { status: 500 }
    );
  }
}
