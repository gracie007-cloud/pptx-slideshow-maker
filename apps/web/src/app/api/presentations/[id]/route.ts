import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updatePresentationSchema = z.object({
  title: z.string().min(1).max(255),
});

/**
 * GET /api/presentations/[id]
 * Get a single presentation with all slides and quizzes. Verifies ownership.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const presentation = await prisma.presentation.findUnique({
      where: { id },
      include: {
        slides: {
          orderBy: { index: "asc" },
        },
        quizzes: {
          orderBy: { order: "asc" },
        },
      },
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

    return NextResponse.json({
      presentation: {
        id: presentation.id,
        title: presentation.title,
        userId: presentation.userId,
        sourceFile: presentation.sourceFile,
        slideCount: presentation.slideCount,
        createdAt: presentation.createdAt,
        updatedAt: presentation.updatedAt,
      },
      slides: presentation.slides,
      quizzes: presentation.quizzes,
    });
  } catch (error) {
    console.error("GET /api/presentations/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch presentation" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/presentations/[id]
 * Update a presentation title. Verifies ownership.
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.presentation.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Presentation not found" },
        { status: 404 }
      );
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = updatePresentationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const presentation = await prisma.presentation.update({
      where: { id },
      data: { title: parsed.data.title },
    });

    return NextResponse.json({ presentation });
  } catch (error) {
    console.error("PUT /api/presentations/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update presentation" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/presentations/[id]
 * Delete a presentation and all related data (cascades). Verifies ownership.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.presentation.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Presentation not found" },
        { status: 404 }
      );
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Delete in order to respect foreign key constraints:
    // responses -> participants/quizzes -> sessions -> slides -> presentation
    await prisma.$transaction(async (tx) => {
      // Delete responses for sessions of this presentation
      await tx.response.deleteMany({
        where: { session: { presentationId: id } },
      });

      // Delete participants for sessions of this presentation
      await tx.participant.deleteMany({
        where: { session: { presentationId: id } },
      });

      // Delete sessions
      await tx.session.deleteMany({
        where: { presentationId: id },
      });

      // Delete quizzes (cascades responses via onDelete)
      await tx.quiz.deleteMany({
        where: { presentationId: id },
      });

      // Delete slides
      await tx.slide.deleteMany({
        where: { presentationId: id },
      });

      // Delete presentation
      await tx.presentation.delete({
        where: { id },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/presentations/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete presentation" },
      { status: 500 }
    );
  }
}
