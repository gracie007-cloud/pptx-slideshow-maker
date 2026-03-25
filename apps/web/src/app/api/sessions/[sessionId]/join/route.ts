import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ sessionId: string }>;
}

const joinSessionSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name too long"),
});

/**
 * POST /api/sessions/[sessionId]/join
 * Join a session as a participant. No auth required (audience members).
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params;

    const body = await request.json();
    const parsed = joinSessionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Validate session exists and is in a joinable state
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        presentation: {
          select: {
            id: true,
            title: true,
            slideCount: true,
          },
          include: {
            slides: {
              orderBy: { index: "asc" },
              select: {
                id: true,
                index: true,
                imagePath: true,
                textContent: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    if (session.status !== "WAITING" && session.status !== "ACTIVE") {
      return NextResponse.json(
        {
          error: "Session is not accepting participants",
          status: session.status,
        },
        { status: 409 }
      );
    }

    // Create participant record
    const participant = await prisma.participant.create({
      data: {
        sessionId,
        name: parsed.data.name.trim(),
        stars: 0,
        level: 1,
      },
    });

    return NextResponse.json(
      {
        participant: {
          id: participant.id,
          name: participant.name,
          stars: participant.stars,
          level: participant.level,
          joinedAt: participant.joinedAt,
        },
        session: {
          id: session.id,
          status: session.status,
          currentSlide: session.currentSlide,
          joinCode: session.joinCode,
          presentation: {
            id: session.presentation.id,
            title: session.presentation.title,
            slideCount: session.presentation.slideCount,
            slides: session.presentation.slides,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/sessions/[sessionId]/join error:", error);
    return NextResponse.json(
      { error: "Failed to join session" },
      { status: 500 }
    );
  }
}
