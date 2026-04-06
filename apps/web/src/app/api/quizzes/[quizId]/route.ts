import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { QuizType } from "@slideshow/shared";
import { MAX_QUIZ_TIME_LIMIT } from "@slideshow/shared";

interface RouteParams {
  params: Promise<{ quizId: string }>;
}

const VALID_QUIZ_TYPES: QuizType[] = [
  "MULTIPLE_CHOICE",
  "WORD_CLOUD",
  "SHORT_ANSWER",
  "FILL_IN_BLANK",
  "IMAGE_UPLOAD",
  "DRAWING",
];

const updateQuizSchema = z.object({
  question: z.string().min(1).optional(),
  type: z
    .enum([
      "MULTIPLE_CHOICE",
      "WORD_CLOUD",
      "SHORT_ANSWER",
      "FILL_IN_BLANK",
      "IMAGE_UPLOAD",
      "DRAWING",
    ])
    .optional(),
  options: z
    .array(z.object({ text: z.string(), isCorrect: z.boolean() }))
    .nullable()
    .optional(),
  correctAnswer: z.string().nullable().optional(),
  timeLimit: z.number().int().min(5).max(MAX_QUIZ_TIME_LIMIT).optional(),
  points: z.number().int().min(0).optional(),
  order: z.number().int().min(0).optional(),
  slideId: z.string().nullable().optional(),
});

/**
 * Helper to verify quiz ownership through the presentation.
 */
async function verifyQuizOwnership(quizId: string, userId: string) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      presentation: { select: { userId: true } },
    },
  });

  if (!quiz) {
    return { quiz: null, error: "Quiz not found", status: 404 };
  }

  if (quiz.presentation.userId !== userId) {
    return { quiz: null, error: "Forbidden", status: 403 };
  }

  return { quiz, error: null, status: 200 };
}

/**
 * GET /api/quizzes/[quizId]
 * Get a single quiz by ID. Requires auth.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { quizId } = await params;
    const { quiz, error, status } = await verifyQuizOwnership(
      quizId,
      session.user.id
    );

    if (error) {
      return NextResponse.json({ error }, { status });
    }

    return NextResponse.json({ quiz });
  } catch (error) {
    console.error("GET /api/quizzes/[quizId] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch quiz" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/quizzes/[quizId]
 * Update a quiz. Requires auth and ownership.
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { quizId } = await params;
    const { quiz: existing, error, status } = await verifyQuizOwnership(
      quizId,
      session.user.id
    );

    if (error) {
      return NextResponse.json({ error }, { status });
    }

    const body = await request.json();
    const parsed = updateQuizSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // For MULTIPLE_CHOICE, validate options
    const effectiveType = parsed.data.type ?? existing!.type;
    if (effectiveType === "MULTIPLE_CHOICE" && parsed.data.options !== undefined) {
      if (
        !Array.isArray(parsed.data.options) ||
        (parsed.data.options && parsed.data.options.length < 2)
      ) {
        return NextResponse.json(
          { error: "MULTIPLE_CHOICE requires at least 2 options" },
          { status: 400 }
        );
      }
    }

    // Build update data from provided fields only
    const updateData: Prisma.QuizUpdateInput = {};
    if (parsed.data.question !== undefined) updateData.question = parsed.data.question;
    if (parsed.data.type !== undefined) updateData.type = parsed.data.type;
    if (parsed.data.options !== undefined)
      updateData.options = parsed.data.options as Prisma.InputJsonValue;
    if (parsed.data.correctAnswer !== undefined)
      updateData.correctAnswer = parsed.data.correctAnswer;
    if (parsed.data.timeLimit !== undefined) updateData.timeLimit = parsed.data.timeLimit;
    if (parsed.data.points !== undefined) updateData.points = parsed.data.points;
    if (parsed.data.order !== undefined) updateData.order = parsed.data.order;
    if (parsed.data.slideId !== undefined) updateData.slideId = parsed.data.slideId;

    const quiz = await prisma.quiz.update({
      where: { id: quizId },
      data: updateData,
    });

    return NextResponse.json({ quiz });
  } catch (error) {
    console.error("PUT /api/quizzes/[quizId] error:", error);
    return NextResponse.json(
      { error: "Failed to update quiz" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/quizzes/[quizId]
 * Delete a quiz and its associated responses. Requires auth and ownership.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { quizId } = await params;
    const { error, status } = await verifyQuizOwnership(
      quizId,
      session.user.id
    );

    if (error) {
      return NextResponse.json({ error }, { status });
    }

    // Delete responses first, then the quiz
    await prisma.$transaction(async (tx) => {
      await tx.response.deleteMany({ where: { quizId } });
      await tx.quiz.delete({ where: { id: quizId } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/quizzes/[quizId] error:", error);
    return NextResponse.json(
      { error: "Failed to delete quiz" },
      { status: 500 }
    );
  }
}
