import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * POST /api/sessions/join
 * Audience member joins a session by code + name.
 * Returns session info and creates a Participant record.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, name } = body;

    if (!code || !name?.trim()) {
      return NextResponse.json(
        { error: "Session code and name are required." },
        { status: 400 }
      );
    }

    const session = await prisma.session.findUnique({
      where: { joinCode: code.toUpperCase() },
      include: {
        presentation: {
          select: {
            id: true,
            title: true,
            slideCount: true,
          },
        },
        participants: {
          where: { name: name.trim() },
          take: 1,
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found. Check your code and try again." },
        { status: 404 }
      );
    }

    if (session.status === "ENDED") {
      return NextResponse.json(
        { error: "This session has ended." },
        { status: 410 }
      );
    }

    // Upsert participant (rejoin if same name)
    let participant = session.participants[0];
    if (!participant) {
      participant = await prisma.participant.create({
        data: {
          sessionId: session.id,
          name: name.trim(),
        },
      });
    }

    return NextResponse.json({
      sessionId: session.id,
      joinCode: session.joinCode,
      status: session.status,
      currentSlide: session.currentSlide,
      participantId: participant.id,
      presentationTitle: session.presentation.title,
      slideCount: session.presentation.slideCount,
      presentationId: session.presentation.id,
    });
  } catch (error) {
    console.error("POST /api/sessions/join error:", error);
    return NextResponse.json(
      { error: "Failed to join session." },
      { status: 500 }
    );
  }
}
