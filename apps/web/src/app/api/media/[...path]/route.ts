import { NextRequest, NextResponse } from "next/server";
import { downloadFile, USE_GCS } from "@/lib/storage";

const CONTENT_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  svg: "image/svg+xml",
  pdf: "application/pdf",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

/**
 * GET /api/media/[...path]
 *
 * Authenticated proxy for GCS objects (or local uploads in dev).
 * This avoids the need for a public GCS bucket.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const storagePath = path.join("/");

  // Block path traversal
  if (storagePath.includes("..")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const data = await downloadFile(storagePath);
    const ext = storagePath.split(".").pop()?.toLowerCase() ?? "";
    const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";

    return new NextResponse(new Uint8Array(data), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
      },
    });
  } catch (_err) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
