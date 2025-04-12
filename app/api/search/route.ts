// app/api/search/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const {
      name,
      resolution,
      author,
      tags,
      minRating,
      minDownloads,
      minViews,
      sortBy,
      page = 1,
      limit = 12,
    } = await req.json();

    const session = await getServerSession(authOptions);

    // Get user favorites if logged in
    let userFavorites: number[] = [];
    if (session?.user) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email as string },
        include: { favorites: true },
      });

      if (user?.favorites) {
        userFavorites = user.favorites.map((fav) => fav.packId);
      }
    }

    const where: any = {};

    if (name) {
      where.name = { contains: name, mode: "insensitive" };
    }

    if (author) {
      where.author = { contains: author, mode: "insensitive" };
    }

    if (resolution) {
      where.resolution = resolution;
    }

    if (tags && tags.length > 0) {
      where.tags = {
        hasEvery: tags,
      };
    }

    if (minRating) {
      where.ratings = {
        some: {
          value: {
            gte: Number.parseInt(minRating),
          },
        },
      };
    }

    if (minDownloads) {
      where.downloadCount = {
        gte: Number.parseInt(minDownloads),
      };
    }

    if (minViews) {
      where.viewCount = {
        gte: Number.parseInt(minViews),
      };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalCount = await prisma.pack.count({ where });

    // Determine the sort order based on the sortBy parameter
    let orderBy: any = {};

    switch (sortBy) {
      case "newest":
        orderBy = { createdAt: "desc" };
        break;
      case "oldest":
        orderBy = { createdAt: "asc" };
        break;
      case "rating":
        orderBy = { ratings: { _count: "desc" } };
        break;
      case "downloads":
      case "most-downloaded":
        orderBy = { downloadCount: "desc" };
        break;
      case "least-downloaded":
        orderBy = { downloadCount: "asc" };
        break;
      case "views":
      case "most-viewed":
        orderBy = { viewCount: "desc" };
        break;
      case "least-viewed":
        orderBy = { viewCount: "asc" };
        break;
      case "a-z":
        orderBy = { name: "asc" };
        break;
      case "z-a":
        orderBy = { name: "desc" };
        break;
      default:
        orderBy = { createdAt: "desc" };
    }

    const packs = await prisma.pack.findMany({
      where,
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
      orderBy,
      skip,
      take: limit,
    });

    let sortedPacks = [...packs];

    if (name) {
      sortedPacks = sortedPacks.sort((a, b) => {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        const searchTerm = name.toLowerCase();

        if (nameA === searchTerm && nameB !== searchTerm) return -1;
        if (nameB === searchTerm && nameA !== searchTerm) return 1;

        if (nameA.startsWith(searchTerm) && !nameB.startsWith(searchTerm))
          return -1;
        if (nameB.startsWith(searchTerm) && !nameA.startsWith(searchTerm))
          return 1;

        const indexA = nameA.indexOf(searchTerm);
        const indexB = nameB.indexOf(searchTerm);

        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;

        return 0;
      });
    }

    const packsWithAvgRating = sortedPacks.map((pack) => {
      const ratings = pack.ratings || [];
      const totalRating = ratings.reduce(
        (sum, rating) => sum + rating.value,
        0
      );
      const averageRating =
        ratings.length > 0 ? totalRating / ratings.length : 0;

      // Check if this pack is favorited by the current user
      const isFavorited = session?.user
        ? pack.favorites && pack.favorites.length > 0
        : false;

      const { ratings: _, favorites: __, ...packWithoutRatings } = pack;

      return {
        ...packWithoutRatings,
        averageRating: Number.parseFloat(averageRating.toFixed(1)),
        ratingCount: ratings.length,
        isFavorited,
      };
    });

    // If user is logged in, show favorited packs first
    if (session?.user && userFavorites.length > 0) {
      packsWithAvgRating.sort((a, b) => {
        if (a.isFavorited && !b.isFavorited) return -1;
        if (!a.isFavorited && b.isFavorited) return 1;
        return 0;
      });
    }

    return NextResponse.json({
      packs: packsWithAvgRating,
      total: totalCount,
    });
  } catch (error) {
    console.error("Search query failed:", error);
    return NextResponse.json(
      { error: "Failed to search packs" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { packId } = await req.json();

    if (!packId) {
      return NextResponse.json(
        { error: "Pack ID is required" },
        { status: 400 }
      );
    }

    const updatedPack = await prisma.pack.update({
      where: { id: Number.parseInt(packId) },
      data: {
        downloadCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      downloadCount: updatedPack.downloadCount,
    });
  } catch (error) {
    console.error("Failed to increment download count:", error);
    return NextResponse.json(
      { error: "Failed to update download count" },
      { status: 500 }
    );
  }
}
