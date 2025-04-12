import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions, isAdmin } from "@/lib/auth";

// Get all users (admin only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Check if the requester is an admin
    if (!session || !isAdmin(session)) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
      },
      orderBy: {
        username: "asc",
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
