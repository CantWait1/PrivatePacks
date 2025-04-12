import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isSpam } from "@/lib/spam-detection";
import { rateLimit } from "@/middleware/rate-limit";

// Update the GET function to support pagination
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const packId = url.searchParams.get("packId");
    const parentId = url.searchParams.get("parentId") || null;
    const sort = url.searchParams.get("sort") || "recent"; // recent, popular
    const page = Number.parseInt(url.searchParams.get("page") || "1");
    const limit = Number.parseInt(url.searchParams.get("limit") || "5");

    if (!packId) {
      return NextResponse.json(
        { error: "Pack ID is required" },
        { status: 400 }
      );
    }

    // Base query
    const whereClause: any = {
      packId: Number.parseInt(packId),
    };

    // Filter for top-level comments or replies
    if (parentId === null) {
      whereClause.parentId = null;
    } else if (parentId) {
      whereClause.parentId = Number.parseInt(parentId);
    }

    // Determine sort order
    let orderBy: any = { createdAt: "desc" };
    if (sort === "popular") {
      orderBy = [{ upvotes: { _count: "desc" } }, { createdAt: "desc" }];
    }

    // Get total count for pagination
    const totalCount = await prisma.comment.count({
      where: whereClause,
    });

    // Calculate pagination
    const skip = (page - 1) * limit;

    const comments = await prisma.comment.findMany({
      where: whereClause,
      orderBy,
      skip,
      take: limit,
      include: {
        user: {
          select: {
            username: true,
            role: true,
            isVerified: true,
            colorPreference: true, // Include color preference
          },
        },
        upvotes: {
          select: {
            userId: true,
          },
        },
        downvotes: {
          select: {
            userId: true,
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
    });

    // Get the current user's ID if logged in
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user
      ? (
          await prisma.user.findUnique({
            where: { email: session.user.email as string },
          })
        )?.id
      : null;

    // Format comments for the frontend
    const formattedComments = comments.map((comment) => ({
      id: comment.id,
      packId: comment.packId,
      parentId: comment.parentId,
      userId: comment.userId,
      username: comment.user.username,
      content: comment.content,
      createdAt: comment.createdAt,
      upvoteCount: comment.upvotes.length,
      downvoteCount: comment.downvotes.length,
      replyCount: comment._count.replies,
      userVote: currentUserId
        ? comment.upvotes.some((u) => u.userId === currentUserId)
          ? "up"
          : comment.downvotes.some((d) => d.userId === currentUserId)
          ? "down"
          : null
        : null,
      userRole: comment.user.role,
      isVerified: comment.user.isVerified,
      colorPreference: comment.user.colorPreference || 0, // Include color preference
    }));

    return NextResponse.json({
      comments: formattedComments,
      total: totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    console.error("Failed to fetch comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "User is not authenticated" },
        { status: 401 }
      );
    }

    const ip = request.headers.get("x-forwarded-for") || "anonymous";
    const username = session.user.username || "";

    // Rate limiting
    const rateLimitOptions = { limit: 5, window: 60 };
    const { success, limit, remaining, reset } = await rateLimit(
      request,
      rateLimitOptions
    );

    if (!success) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Please try again later.",
          limit,
          remaining,
          reset,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
          },
        }
      );
    }

    const { packId, content, parentId } = await request.json();

    if (!packId) {
      return NextResponse.json(
        { error: "Pack ID is required" },
        { status: 400 }
      );
    }

    if (!content || content.trim() === "") {
      return NextResponse.json(
        { error: "Comment cannot be empty" },
        { status: 400 }
      );
    }

    if (content.length > 500) {
      return NextResponse.json(
        { error: "Comment is too long (max 500 characters)" },
        { status: 400 }
      );
    }

    // Check if the pack exists
    const pack = await prisma.pack.findUnique({
      where: { id: Number(packId) },
    });

    if (!pack) {
      return NextResponse.json({ error: "Pack not found" }, { status: 404 });
    }

    // If this is a reply, check if the parent comment exists
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: Number(parentId) },
      });

      if (!parentComment) {
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 404 }
        );
      }

      // Ensure the parent comment is for the same pack
      if (parentComment.packId !== Number(packId)) {
        return NextResponse.json(
          { error: "Parent comment does not belong to this pack" },
          { status: 400 }
        );
      }
    }

    // Check for spam if the function exists
    try {
      if (typeof isSpam === "function") {
        const spamCheck = isSpam(content);
        if (spamCheck.isSpam) {
          return NextResponse.json(
            {
              error: `Your comment was flagged as potential spam: ${spamCheck.reason}. Please revise and try again.`,
            },
            { status: 400 }
          );
        }
      }
    } catch (error) {
      console.error("Spam check error:", error);
      // Continue even if spam check fails
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create the comment
    const comment = await prisma.comment.create({
      data: {
        content,
        packId: Number(packId),
        userId: user.id,
        parentId: parentId ? Number(parentId) : null,
      },
      include: {
        user: {
          select: {
            username: true,
            role: true,
            isVerified: true,
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
    });

    return NextResponse.json({
      comment: {
        id: comment.id,
        packId: comment.packId,
        parentId: comment.parentId,
        userId: comment.userId,
        username: comment.user.username,
        content: comment.content,
        createdAt: comment.createdAt,
        upvoteCount: 0,
        downvoteCount: 0,
        replyCount: 0,
        userVote: null,
        userRole: comment.user.role,
        isVerified: comment.user.isVerified,
      },
    });
  } catch (error) {
    console.error("Error posting comment:", error);
    return NextResponse.json(
      { error: "Failed to post comment. Please try again later." },
      { status: 500 }
    );
  }
}
