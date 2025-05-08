import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const count = await prisma.pack.count();
    const randomSkip = Math.floor(Math.random() * count);
    const randomPack = await prisma.pack.findFirst({
      skip: randomSkip,
      orderBy: { id: "asc" },
    });

    if (!randomPack) {
      return NextResponse.json({ error: "No packs found" }, { status: 404 });
    }

    return NextResponse.json(randomPack);
  } catch (error) {
    console.error("Error fetching random pack:", error);
    return NextResponse.json(
      { error: "Failed to fetch random pack" },
      { status: 500 }
    );
  }
}
