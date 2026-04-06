import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { uploadFile } from "@/lib/storage";
import {
  MAX_PPTX_SIZE,
  ALLOWED_PPTX_TYPES,
  PPTX_PIPELINE_ENDPOINTS,
} from "@slideshow/shared";
import type { PptxProcessResult } from "@slideshow/shared";

const PIPELINE_URL =
  process.env.PIPELINE_URL ?? process.env.PPTX_PIPELINE_URL ?? "http://localhost:8100";

/**
 * POST /api/upload
 * Handle PPTX file upload, store in GCS/local, forward to pipeline, create DB records.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided. Expected a 'file' field in form data." },
        { status: 400 }
      );
    }

    if (
      !ALLOWED_PPTX_TYPES.includes(file.type) &&
      !file.name.endsWith(".pptx") &&
      !file.name.endsWith(".ppt")
    ) {
      return NextResponse.json(
        { error: "Invalid file type. Only .pptx and .ppt files are accepted." },
        { status: 400 }
      );
    }

    if (file.size > MAX_PPTX_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum ${MAX_PPTX_SIZE / 1024 / 1024}MB.` },
        { status: 413 }
      );
    }

    const title =
      formData.get("title")?.toString() ||
      file.name.replace(/\.(pptx?|ppt)$/i, "");

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const presentationId = crypto.randomUUID();

    // Store source PPTX in GCS / local
    const storedFile = await uploadFile(
      fileBuffer,
      `pptx/${userId}/${presentationId}/${file.name}`,
      file.type || "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    );

    // Attempt to call the Python pipeline
    let result: PptxProcessResult | null = null;

    try {
      const pipelineForm = new FormData();
      pipelineForm.append("file", new Blob([fileBuffer], { type: file.type }), file.name);
      pipelineForm.append("presentation_id", presentationId);

      // Pass GCS bucket info so pipeline can upload slide images directly
      if (process.env.GCS_BUCKET) {
        pipelineForm.append("gcs_bucket", process.env.GCS_BUCKET);
        pipelineForm.append("gcs_prefix", `slides/${presentationId}`);
      }

      // Get auth token for Cloud Run service-to-service calls
      const headers: Record<string, string> = {};
      if (process.env.NODE_ENV === "production") {
        const tokenUrl = `http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token`;
        const tokenRes = await fetch(tokenUrl, {
          headers: { "Metadata-Flavor": "Google" },
        }).catch(() => null);
        if (tokenRes?.ok) {
          const { access_token } = await tokenRes.json();
          headers["Authorization"] = `Bearer ${access_token}`;
        }
      }

      const pipelineResponse = await fetch(
        `${PIPELINE_URL}${PPTX_PIPELINE_ENDPOINTS.process}`,
        { method: "POST", body: pipelineForm, headers, signal: AbortSignal.timeout(120_000) }
      );

      if (pipelineResponse.ok) {
        result = await pipelineResponse.json();
      } else {
        console.warn("Pipeline returned error:", await pipelineResponse.text());
      }
    } catch (err) {
      console.warn("Pipeline unavailable, creating placeholder slides:", err);
    }

    // Build slide data (from pipeline result or placeholder)
    const slides = result?.slides ?? buildPlaceholderSlides(1, presentationId);
    const slideCount = result?.slideCount ?? slides.length;

    // Create DB records in a transaction
    const presentation = await prisma.$transaction(async (tx) => {
      const pres = await tx.presentation.create({
        data: {
          id: presentationId,
          title,
          sourceFile: storedFile.path,
          slideCount,
          userId,
        },
      });

      if (slides.length > 0) {
        const slideData: Prisma.SlideCreateManyInput[] = slides.map((slide) => ({
          presentationId: pres.id,
          index: slide.index,
          imagePath: slide.imagePath,
          textContent: slide.textContent ?? null,
          speakerNotes: slide.speakerNotes ?? null,
          shapes: slide.shapes ? (slide.shapes as unknown as Prisma.InputJsonValue) : Prisma.DbNull,
        }));
        await tx.slide.createMany({ data: slideData });
      }

      return pres;
    });

    const fullPresentation = await prisma.presentation.findUnique({
      where: { id: presentation.id },
      include: { slides: { orderBy: { index: "asc" } } },
    });

    return NextResponse.json(
      { message: "File uploaded successfully", presentation: fullPresentation },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/upload error:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}

/** Generate placeholder slides when pipeline is unavailable. */
function buildPlaceholderSlides(count: number, presentationId: string) {
  return Array.from({ length: count }, (_, i) => ({
    index: i,
    imagePath: `/api/slides/${presentationId}/${i}/placeholder`,
    textContent: null,
    speakerNotes: null,
    shapes: null,
  }));
}
