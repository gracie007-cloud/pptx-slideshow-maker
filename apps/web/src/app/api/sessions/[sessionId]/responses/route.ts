import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ sessionId: string }>;
}

const submitResponseSchema = z.object({
  quizId: z.string().min(1),
  participantId: z.string().min(1),
  answer: z.unknown(),
  responseTime: z.number().int().min(0).optional(),
});

/**
 * POST /api/sessions/[sessionId]/responses
 * Submit a quiz response as a participant.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params;

    const body = await request.json();
    const parsed = submitResponseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { quizId, participantId, answer, responseTime } = parsed.data;

    // Validate session exists and is active
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    if (session.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Session is not active" },
        { status: 409 }
      );
    }

    // Validate participant belongs to this session
    const participant = await prisma.participant.findFirst({
      where: { id: participantId, sessionId },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Participant not found in this session" },
        { status: 404 }
      );
    }

    // Validate quiz exists and belongs to the session's presentation
    const quiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
        presentationId: session.presentationId,
      },
    });

    if (!quiz) {
      return NextResponse.json(
        { error: "Quiz not found for this session's presentation" },
        { status: 404 }
      );
    }

    // Check for duplicate response
    const existingResponse = await prisma.response.findUnique({
      where: {
        quizId_sessionId_participantId: {
          quizId,
          sessionId,
          participantId,
        },
      },
    });

    if (existingResponse) {
      return NextResponse.json(
        { error: "Already responded to this quiz" },
        { status: 409 }
      );
    }

    // Determine correctness and points
    let isCorrect: boolean | null = null;
    let pointsAwarded = 0;

    const answerStr =
      typeof answer === "string" ? answer : JSON.stringify(answer);

    if (quiz.type === "MULTIPLE_CHOICE") {
      // For MC, check if the answer matches the correct answer
      if (quiz.correctAnswer) {
        isCorrect =
          answerStr.trim().toLowerCase() ===
          quiz.correctAnswer.trim().toLowerCase();
        if (isCorrect) {
          pointsAwarded = quiz.points;
        }
      }
    } else if (quiz.type === "FILL_IN_BLANK") {
      // For fill-in-blank, case-insensitive match
      if (quiz.correctAnswer) {
        isCorrect =
          answerStr.trim().toLowerCase() ===
          quiz.correctAnswer.trim().toLowerCase();
        if (isCorrect) {
          pointsAwarded = quiz.points;
        }
      }
    }
    // WORD_CLOUD, SHORT_ANSWER, IMAGE_UPLOAD, DRAWING don't have a "correct" answer

    // Create the response record and update participant stars in a transaction
    const [response] = await prisma.$transaction([
      prisma.response.create({
        data: {
          quizId,
          sessionId,
          participantId,
          answer: answer as any,
          isCorrect,
          responseTime: responseTime ?? null,
          pointsAwarded,
        },
      }),
      // Award stars to participant if they got points
      ...(pointsAwarded > 0
        ? [
            prisma.participant.update({
              where: { id: participantId },
              data: {
                stars: { increment: pointsAwarded },
              },
            }),
          ]
        : []),
    ]);

    return NextResponse.json(
      {
        response: {
          id: response.id,
          quizId: response.quizId,
          participantId: response.participantId,
          answer: response.answer,
          isCorrect: response.isCorrect,
          pointsAwarded: response.pointsAwarded,
          responseTime: response.responseTime,
          createdAt: response.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/sessions/[sessionId]/responses error:", error);
    return NextResponse.json(
      { error: "Failed to submit response" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sessions/[sessionId]/responses
 * Get all responses for a session (for analytics). Requires auth (presenter).
 * Optional ?quizId filter.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authSession = await auth();
    if (!authSession?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await params;

    // Verify the session exists and the user is the presenter
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        presentation: { select: { userId: true } },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    if (session.presentation.userId !== authSession.user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const quizId = searchParams.get("quizId");

    const where: Record<string, unknown> = { sessionId };
    if (quizId) {
      where.quizId = quizId;
    }

    const responses = await prisma.response.findMany({
      where,
      include: {
        participant: {
          select: { id: true, name: true, stars: true },
        },
        quiz: {
          select: { id: true, question: true, type: true, correctAnswer: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Calculate summary statistics
    const totalResponses = responses.length;
    const correctCount = responses.filter((r) => r.isCorrect === true).length;
    const totalPoints = responses.reduce((sum, r) => sum + r.pointsAwarded, 0);
    const avgResponseTime =
      responses.filter((r) => r.responseTime != null).length > 0
        ? responses
            .filter((r) => r.responseTime != null)
            .reduce((sum, r) => sum + (r.responseTime ?? 0), 0) /
          responses.filter((r) => r.responseTime != null).length
        : null;

    return NextResponse.json({
      responses,
      summary: {
        totalResponses,
        correctCount,
        totalPoints,
        averageResponseTime: avgResponseTime,
      },
    });
  } catch (error) {
    console.error("GET /api/sessions/[sessionId]/responses error:", error);
    return NextResponse.json(
      { error: "Failed to fetch responses" },
      { status: 500 }
    );
  }
}
