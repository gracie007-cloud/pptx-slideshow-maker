import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { QuizType } from "@slideshow/shared";
import {
  DEFAULT_QUIZ_TIME_LIMIT,
  DEFAULT_QUIZ_POINTS,
  MAX_QUIZ_TIME_LIMIT,
} from "@slideshow/shared";

const VALID_QUIZ_TYPES: QuizType[] = [
  "MULTIPLE_CHOICE",
  "WORD_CLOUD",
  "SHORT_ANSWER",
  "FILL_IN_BLANK",
  "IMAGE_UPLOAD",
  "DRAWING",
];

const createQuizSchema = z.object({
  presentationId: z.string().min(1),
  slideId: z.string().nullable().optional(),
  type: z.enum([
    "MULTIPLE_CHOICE",
    "WORD_CLOUD",
    "SHORT_ANSWER",
    "FILL_IN_BLANK",
    "IMAGE_UPLOAD",
    "DRAWING",
  ]),
  question: z.string().min(1),
  options: z
    .array(z.object({ text: z.string(), isCorrect: z.boolean() }))
    .nullable()
    .optional(),
  correctAnswer: z.string().nullable().optional(),
  timeLimit: z
    .number()
    .int()
    .min(5)
    .max(MAX_QUIZ_TIME_LIMIT)
    .optional()
    .default(DEFAULT_QUIZ_TIME_LIMIT),
  points: z.number().int().min(0).optional().default(DEFAULT_QUIZ_POINTS),
  order: z.number().int().min(0).optional(),
});

/**
 * GET /api/quizzes
 * List quizzes for a presentation. Requires auth.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const presentationId = searchParams.get("presentationId");

    if (!presentationId) {
      return NextResponse.json(
        { error: "presentationId query parameter is required" },
        { status: 400 }
      );
    }

    // Verify the user owns the presentation
    const presentation = await prisma.presentation.findUnique({
      where: { id: presentationId },
      select: { userId: true },
    });

    if (!presentation) {
      return NextResponse.json(
        { error: "Presentation not found" },
        { status: 404 }
      );
    }

    if (presentation.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const quizzes = await prisma.quiz.findMany({
      where: { presentationId },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ quizzes });
  } catch (error) {
    console.error("GET /api/quizzes error:", error);
    return NextResponse.json(
      { error: "Failed to fetch quizzes" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/quizzes
 * Create a new quiz for a presentation. Requires auth.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createQuizSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Verify the user owns the presentation
    const presentation = await prisma.presentation.findUnique({
      where: { id: parsed.data.presentationId },
      select: { userId: true },
    });

    if (!presentation) {
      return NextResponse.json(
        { error: "Presentation not found" },
        { status: 404 }
      );
    }

    if (presentation.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // For MULTIPLE_CHOICE, validate options
    if (parsed.data.type === "MULTIPLE_CHOICE") {
      if (!Array.isArray(parsed.data.options) || parsed.data.options.length < 2) {
        return NextResponse.json(
          { error: "MULTIPLE_CHOICE requires at least 2 options" },
          { status: 400 }
        );
      }
    }

    // Determine order (append to end if not specified)
    let order = parsed.data.order;
    if (order === undefined) {
      const lastQuiz = await prisma.quiz.findFirst({
        where: { presentationId: parsed.data.presentationId },
        orderBy: { order: "desc" },
      });
      order = lastQuiz ? lastQuiz.order + 1 : 0;
    }

    const quiz = await prisma.quiz.create({
      data: {
        presentationId: parsed.data.presentationId,
        slideId: parsed.data.slideId ?? null,
        type: parsed.data.type,
        question: parsed.data.question,
        options: parsed.data.options ?? undefined,
        correctAnswer: parsed.data.correctAnswer ?? null,
        timeLimit: parsed.data.timeLimit,
        points: parsed.data.points,
        order,
      },
    });

    return NextResponse.json({ quiz }, { status: 201 });
  } catch (error) {
    console.error("POST /api/quizzes error:", error);
    return NextResponse.json(
      { error: "Failed to create quiz" },
      { status: 500 }
    );
  }
}
