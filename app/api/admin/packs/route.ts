import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions, isAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !isAdmin(session)) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    const {
      name,
      author,
      resolution,
      iconImage,
      tags,
      downloadUrl,
      additionalImages,
    } = await req.json();

    // Validate required fields
    if (!name || !author || !resolution || !iconImage || !downloadUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create the pack
    const newPack = await prisma.pack.create({
      data: {
        name,
        author,
        resolution,
        iconImage,
        tags: tags || [],
        downloadUrl,
        additionalImages: additionalImages || [],
      },
    });

    return NextResponse.json({ pack: newPack }, { status: 201 });
  } catch (error) {
    console.error("Failed to create pack:", error);
    return NextResponse.json(
      { error: "Failed to create pack" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !isAdmin(session)) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    const packs = await prisma.pack.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ packs });
  } catch (error) {
    console.error("Failed to fetch packs:", error);
    return NextResponse.json(
      { error: "Failed to fetch packs" },
      { status: 500 }
    );
  }
}
