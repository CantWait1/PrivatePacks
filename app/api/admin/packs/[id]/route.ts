import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteUnusedImages } from "@/lib/blob-utils";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authorization
    const session = await getServerSession(authOptions);
    if (!session || !isAdmin(session)) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid pack ID" }, { status: 400 });
    }

    const data = await request.json();

    // Fetch the existing pack to get the old images
    const existingPack = await prisma.pack.findUnique({
      where: { id },
      select: {
        iconImage: true,
        additionalImages: true,
      },
    });

    if (!existingPack) {
      return NextResponse.json({ error: "Pack not found" }, { status: 404 });
    }

    // Update the pack
    const updatedPack = await prisma.pack.update({
      where: { id },
      data: {
        name: data.name,
        author: data.author,
        resolution: data.resolution,
        iconImage: data.iconImage,
        tags: data.tags,
        downloadUrl: data.downloadUrl,
        additionalImages: data.additionalImages,
      },
    });

    // Collect old and new images for comparison
    const oldImages = [
      existingPack.iconImage,
      ...(existingPack.additionalImages || []),
    ];
    const newImages = [
      updatedPack.iconImage,
      ...(updatedPack.additionalImages || []),
    ];

    // Delete unused images in the background
    // We don't await this to avoid blocking the response
    deleteUnusedImages(oldImages, newImages).catch((error) => {
      console.error("Error deleting unused images:", error);
    });

    return NextResponse.json({ pack: updatedPack });
  } catch (error) {
    console.error("Error updating pack:", error);
    return NextResponse.json(
      { error: "Failed to update pack" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authorization
    const session = await getServerSession(authOptions);
    if (!session || !isAdmin(session)) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid pack ID" }, { status: 400 });
    }

    // Fetch the pack to get its images before deletion
    const pack = await prisma.pack.findUnique({
      where: { id },
      select: {
        iconImage: true,
        additionalImages: true,
      },
    });

    if (!pack) {
      return NextResponse.json({ error: "Pack not found" }, { status: 404 });
    }

    // Delete the pack
    await prisma.pack.delete({
      where: { id },
    });

    // Collect all images associated with this pack
    const allImages = [pack.iconImage, ...(pack.additionalImages || [])];

    // Delete all images from Blob storage in the background
    // We don't await this to avoid blocking the response
    deleteUnusedImages(allImages, []).catch((error) => {
      console.error("Error deleting pack images:", error);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting pack:", error);
    return NextResponse.json(
      { error: "Failed to delete pack" },
      { status: 500 }
    );
  }
}
