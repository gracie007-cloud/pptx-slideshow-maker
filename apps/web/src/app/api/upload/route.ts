import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  MAX_PPTX_SIZE,
  ALLOWED_PPTX_TYPES,
  PPTX_PIPELINE_ENDPOINTS,
} from "@slideshow/shared";
import type { PptxProcessResult } from "@slideshow/shared";

const PIPELINE_URL = process.env.PPTX_PIPELINE_URL ?? "http://localhost:8000";

/**
 * POST /api/upload
 * Handle PPTX file upload, forward to Python pipeline, and create DB records.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided. Expected a 'file' field in form data." },
        { status: 400 }
      );
    }

    // Validate file type
    if (
      !ALLOWED_PPTX_TYPES.includes(file.type) &&
      !file.name.endsWith(".pptx") &&
      !file.name.endsWith(".ppt")
    ) {
      return NextResponse.json(
        {
          error: "Invalid file type. Only .pptx and .ppt files are accepted.",
          received: file.type,
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_PPTX_SIZE) {
      return NextResponse.json(
        {
          error: `File too large. Maximum size is ${MAX_PPTX_SIZE / (1024 * 1024)}MB.`,
          size: file.size,
        },
        { status: 413 }
      );
    }

    // Forward to Python pipeline service
    const pipelineFormData = new FormData();
    pipelineFormData.append("file", file);

    const title = formData.get("title")?.toString() || file.name.replace(/\.(pptx?|ppt)$/i, "");
    pipelineFormData.append("title", title);

    const pipelineResponse = await fetch(
      `${PIPELINE_URL}${PPTX_PIPELINE_ENDPOINTS.process}`,
      {
        method: "POST",
        body: pipelineFormData,
      }
    );

    if (!pipelineResponse.ok) {
      const errorText = await pipelineResponse.text();
      console.error("Pipeline processing failed:", errorText);
      return NextResponse.json(
        { error: "Failed to process presentation file" },
        { status: 502 }
      );
    }

    const result: PptxProcessResult = await pipelineResponse.json();

    // Create presentation and slide records in a transaction
    const presentation = await prisma.$transaction(async (tx) => {
      const pres = await tx.presentation.create({
        data: {
          title: title,
          sourceFile: file.name,
          slideCount: result.slideCount,
          userId: session.user!.id,
        },
      });

      // Create slide records for each processed slide
      if (result.slides && result.slides.length > 0) {
        await tx.slide.createMany({
          data: result.slides.map((slide) => ({
            presentationId: pres.id,
            index: slide.index,
            imagePath: slide.imagePath,
            textContent: slide.textContent || null,
            speakerNotes: slide.speakerNotes || null,
            shapes: slide.shapes ? (slide.shapes as any) : null,
          })),
        });
      }

      return pres;
    });

    // Fetch the full presentation with slides to return
    const fullPresentation = await prisma.presentation.findUnique({
      where: { id: presentation.id },
      include: {
        slides: { orderBy: { index: "asc" } },
      },
    });

    return NextResponse.json(
      {
        message: "File uploaded and processed successfully",
        presentation: fullPresentation,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
