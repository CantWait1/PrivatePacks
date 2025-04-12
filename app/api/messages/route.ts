import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { rateLimit } from "@/middleware/rate-limit";
import { isSpam } from "@/lib/spam-detection";

export async function GET() {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const messages = await prisma.chat.findMany({
      where: {
        createdAt: {
          gte: oneWeekAgo,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    prisma.chat
      .deleteMany({
        where: {
          createdAt: {
            lt: oneWeekAgo,
          },
        },
      })
      .catch((error) => console.error("Error deleting old messages:", error));

    return NextResponse.json({ messages });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.username) {
      return NextResponse.json(
        { error: "User is not authenticated" },
        { status: 401 }
      );
    }

    const ip = request.headers.get("x-forwarded-for") || "anonymous";
    const username = session.user.username;

    const { success, limit, remaining, reset } = await rateLimit(ip, username);

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

    const { message } = await request.json();

    if (!message || message.trim() === "") {
      return NextResponse.json(
        { error: "Message cannot be empty" },
        { status: 400 }
      );
    }

    if (message.length > 500) {
      return NextResponse.json(
        { error: "Message is too long (max 500 characters)" },
        { status: 400 }
      );
    }

    const spamCheck = isSpam(message);
    if (spamCheck.isSpam) {
      return NextResponse.json(
        { error: `Message detected as spam: ${spamCheck.reason}` },
        { status: 400 }
      );
    }

    const newMessage = await prisma.chat.create({
      data: {
        message,
        author: username,
      },
    });

    return NextResponse.json({ message: newMessage });
  } catch (error) {
    console.error("Error posting message:", error);
    return NextResponse.json(
      { error: "Failed to post message" },
      { status: 500 }
    );
  }
}
