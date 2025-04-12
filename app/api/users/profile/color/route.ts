import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Change the import to use the constants file
import { USERNAME_COLORS } from "@/app/constants/colors";

// Remove the USERNAME_COLORS constant definition and just export it
export { USERNAME_COLORS };

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to update your profile" },
        { status: 401 }
      );
    }

    const { colorIndex } = await req.json();

    // Validate color index
    if (
      typeof colorIndex !== "number" ||
      colorIndex < 0 ||
      colorIndex >= USERNAME_COLORS.length
    ) {
      return NextResponse.json(
        { error: "Invalid color selection" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update the user's color preference
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        colorPreference: colorIndex,
      },
      select: {
        id: true,
        username: true,
        bio: true,
        role: true,
        createdAt: true,
        isVerified: true,
        colorPreference: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Failed to update user color:", error);
    return NextResponse.json(
      { error: "Failed to update user color" },
      { status: 500 }
    );
  }
}
