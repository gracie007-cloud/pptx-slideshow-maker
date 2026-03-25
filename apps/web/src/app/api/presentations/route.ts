import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

const createPresentationSchema = z.object({
  title: z.string().min(1).max(255),
  sourceFile: z.string().min(1),
  slideCount: z.number().int().min(0).optional().default(0),
});

/**
 * GET /api/presentations
 * List all presentations for the authenticated user with pagination.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10), 1);
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") ?? "20", 10), 1),
      100
    );
    const offset = (page - 1) * limit;

    const [presentations, total] = await Promise.all([
      prisma.presentation.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
        select: {
          id: true,
          title: true,
          slideCount: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.presentation.count({
        where: { userId: session.user.id },
      }),
    ]);

    return NextResponse.json({
      presentations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/presentations error:", error);
    return NextResponse.json(
      { error: "Failed to fetch presentations" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/presentations
 * Create a new presentation record.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createPresentationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const presentation = await prisma.presentation.create({
      data: {
        title: parsed.data.title,
        sourceFile: parsed.data.sourceFile,
        slideCount: parsed.data.slideCount,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ presentation }, { status: 201 });
  } catch (error) {
    console.error("POST /api/presentations error:", error);
    return NextResponse.json(
      { error: "Failed to create presentation" },
      { status: 500 }
    );
  }
}
