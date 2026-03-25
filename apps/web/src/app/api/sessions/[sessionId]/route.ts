import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import redis from "@/lib/redis";
import type { SessionStatus } from "@slideshow/shared";

interface RouteParams {
  params: Promise<{ sessionId: string }>;
}

const VALID_STATUSES: SessionStatus[] = ["WAITING", "ACTIVE", "PAUSED", "ENDED"];

const updateSessionSchema = z.object({
  status: z.enum(["WAITING", "ACTIVE", "PAUSED", "ENDED"]).optional(),
  currentSlide: z.number().int().min(0).optional(),
});

/**
 * GET /api/sessions/[sessionId]
 * Fetch session with participant count and current slide.
 * Also handles join code lookup via ?code=XXXX query param for audience joining.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params;
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    // If a join code is provided, look up the session by code instead of ID
    if (code) {
      const sessionByCode = await prisma.session.findFirst({
        where: {
          joinCode: code.toUpperCase(),
          status: { in: ["WAITING", "ACTIVE"] },
        },
        include: {
          _count: { select: { participants: true } },
          presentation: {
            select: {
              id: true,
              title: true,
              slideCount: true,
            },
          },
        },
      });

      if (!sessionByCode) {
        return NextResponse.json(
          { error: "Session not found or not active" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        session: {
          id: sessionByCode.id,
          presentationId: sessionByCode.presentationId,
          joinCode: sessionByCode.joinCode,
          status: sessionByCode.status,
          currentSlide: sessionByCode.currentSlide,
          participantCount: sessionByCode._count.participants,
          presentation: sessionByCode.presentation,
          startedAt: sessionByCode.startedAt,
          createdAt: sessionByCode.createdAt,
        },
      });
    }

    // Standard session fetch by ID - requires auth for full details
    const authSession = await auth();
    if (!authSession?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const liveSession = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        participants: {
          orderBy: { stars: "desc" },
        },
        presentation: {
          select: {
            id: true,
            title: true,
            slideCount: true,
            userId: true,
          },
        },
        _count: { select: { participants: true } },
      },
    });

    if (!liveSession) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      session: {
        id: liveSession.id,
        presentationId: liveSession.presentationId,
        joinCode: liveSession.joinCode,
        status: liveSession.status,
        currentSlide: liveSession.currentSlide,
        participantCount: liveSession._count.participants,
        participants: liveSession.participants,
        presentation: liveSession.presentation,
        startedAt: liveSession.startedAt,
        endedAt: liveSession.endedAt,
        createdAt: liveSession.createdAt,
      },
    });
  } catch (error) {
    console.error("GET /api/sessions/[sessionId] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch session" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/sessions/[sessionId]
 * Update session status (start/pause/end) and currentSlide. Verifies presenter ownership.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const authSession = await auth();
    if (!authSession?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await params;

    const body = await request.json();
    const parsed = updateSessionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        presentation: {
          select: { userId: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Verify the authenticated user is the presenter (owns the presentation)
    if (existing.presentation.userId !== authSession.user.id) {
      return NextResponse.json(
        { error: "Forbidden: only the presenter can update this session" },
        { status: 403 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (parsed.data.status) {
      updateData.status = parsed.data.status;

      // Set timestamps based on status transitions
      if (parsed.data.status === "ACTIVE" && !existing.startedAt) {
        updateData.startedAt = new Date();
      }
      if (parsed.data.status === "ENDED") {
        updateData.endedAt = new Date();
      }
    }

    if (parsed.data.currentSlide !== undefined) {
      updateData.currentSlide = parsed.data.currentSlide;
    }

    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: updateData,
    });

    // Update Redis session state for real-time sync
    const redisKey = `session:${sessionId}`;
    const redisUpdates: Record<string, string> = {};
    if (parsed.data.status) {
      redisUpdates.status = parsed.data.status;
    }
    if (parsed.data.currentSlide !== undefined) {
      redisUpdates.currentSlide = String(parsed.data.currentSlide);
    }
    if (Object.keys(redisUpdates).length > 0) {
      await redis.hmset(redisKey, redisUpdates);
    }

    return NextResponse.json({ session: updatedSession });
  } catch (error) {
    console.error("PATCH /api/sessions/[sessionId] error:", error);
    return NextResponse.json(
      { error: "Failed to update session" },
      { status: 500 }
    );
  }
}
