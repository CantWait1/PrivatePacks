import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions, isAdmin } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !isAdmin(session)) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    const id = params.id;

    const pack = await prisma.pack.findUnique({
      where: { id: Number.parseInt(id) },
    });

    if (!pack) {
      return NextResponse.json({ error: "Pack not found" }, { status: 404 });
    }

    return NextResponse.json({ pack });
  } catch (error) {
    console.error("Failed to fetch pack:", error);
    return NextResponse.json(
      { error: "Failed to fetch pack" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !isAdmin(session)) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    const id = params.id;
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

    // Update the pack
    const updatedPack = await prisma.pack.update({
      where: { id: Number.parseInt(id) },
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

    return NextResponse.json({ pack: updatedPack });
  } catch (error) {
    console.error("Failed to update pack:", error);
    return NextResponse.json(
      { error: "Failed to update pack" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !isAdmin(session)) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    const id = params.id;

    // Delete the pack
    await prisma.pack.delete({
      where: { id: Number.parseInt(id) },
    });

    return NextResponse.json({ message: "Pack deleted successfully" });
  } catch (error) {
    console.error("Failed to delete pack:", error);
    return NextResponse.json(
      { error: "Failed to delete pack" },
      { status: 500 }
    );
  }
}
