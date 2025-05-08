import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isAdmin } from "@/lib/auth";
import { put } from "@vercel/blob";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    // Check admin authorization
    const session = await getServerSession(authOptions);
    if (!session || !isAdmin(session)) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null;
    const packName = formData.get("packName") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Generate a filename with pack name (if provided) and original extension
    const originalName = file.name;
    const fileExt = originalName.split(".").pop()?.toLowerCase() || "png";

    // Create a sanitized version of the pack name for the filename
    const sanitizedName = packName
      ? packName
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "_")
          .substring(0, 30)
      : type || "pack";

    const fileName = `${sanitizedName}_${uuidv4().substring(0, 8)}.${fileExt}`;

    // Upload directly to Vercel Blob
    const blob = await put(fileName, file, {
      access: "public", // Make the blob publicly accessible
      contentType: file.type,
    });

    return NextResponse.json({
      success: true,
      url: blob.url,
      fileName: fileName,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to process upload" },
      { status: 500 }
    );
  }
}
