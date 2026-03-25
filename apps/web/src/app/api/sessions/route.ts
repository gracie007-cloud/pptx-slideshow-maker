import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import redis from "@/lib/redis";
import { generateJoinCode } from "@/lib/utils";

const createSessionSchema = z.object({
  presentationId: z.string().min(1),
});

/**
 * GET /api/sessions
 * List sessions for the authenticated user, optionally filtered.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const presentationId = searchParams.get("presentationId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {
      presentation: { userId: session.user.id },
    };
    if (presentationId) where.presentationId = presentationId;
    if (status) where.status = status;

    const sessions = await prisma.session.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { participants: true },
        },
        presentation: {
          select: { id: true, title: true },
        },
      },
    });

    const formatted = sessions.map((s: any) => ({
      id: s.id,
      presentationId: s.presentationId,
      presentationTitle: s.presentation.title,
      joinCode: s.joinCode,
      status: s.status,
      currentSlide: s.currentSlide,
      participantCount: s._count.participants,
      startedAt: s.startedAt,
      endedAt: s.endedAt,
      createdAt: s.createdAt,
    }));

    return NextResponse.json({ sessions: formatted });
  } catch (error) {
    console.error("GET /api/sessions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sessions
 * Create a new live session with a unique join code.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createSessionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Verify presentation exists and belongs to the user
    const presentation = await prisma.presentation.findUnique({
      where: { id: parsed.data.presentationId },
    });

    if (!presentation) {
      return NextResponse.json(
        { error: "Presentation not found" },
        { status: 404 }
      );
    }

    if (presentation.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Generate unique join code with collision check
    let joinCode: string;
    let attempts = 0;
    do {
      joinCode = generateJoinCode();
      const existing = await prisma.session.findFirst({
        where: { joinCode, status: { in: ["WAITING", "ACTIVE", "PAUSED"] } },
      });
      if (!existing) break;
      attempts++;
    } while (attempts < 10);

    if (attempts >= 10) {
      return NextResponse.json(
        { error: "Failed to generate unique join code" },
        { status: 500 }
      );
    }

    const liveSession = await prisma.session.create({
      data: {
        presentationId: parsed.data.presentationId,
        joinCode,
        status: "WAITING",
        currentSlide: 0,
      },
    });

    // Initialize session state in Redis for real-time features (optional)
    try {
      const redisKey = `session:${liveSession.id}`;
      await redis.hmset(redisKey, {
        status: "WAITING",
        currentSlide: "0",
        presentationId: parsed.data.presentationId,
        presenterId: session.user.id,
        joinCode,
        participantCount: "0",
      });
      await redis.expire(redisKey, 86400);
    } catch {
      // Redis unavailable — session still works via DB + Socket.io in-memory
      console.warn("Redis unavailable, session created without Redis state");
    }

    return NextResponse.json({ session: liveSession }, { status: 201 });
  } catch (error) {
    console.error("POST /api/sessions error:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}
