import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/slides/[presentationId]/[slideIndex]/placeholder
 *
 * Returns an SVG placeholder image for slides that haven't been processed yet.
 * Used in development when the Python pipeline isn't running.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ presentationId: string; slideIndex: string }> }
) {
  const { presentationId, slideIndex } = await params;
  const index = parseInt(slideIndex, 10) || 0;

  const colors = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];
  const bg = colors[index % colors.length];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <rect width="1280" height="720" fill="${bg}" opacity="0.15"/>
  <rect x="40" y="40" width="1200" height="640" rx="16" fill="white" fill-opacity="0.6"/>
  <text x="640" y="300" font-family="system-ui,sans-serif" font-size="48" font-weight="700"
    fill="${bg}" text-anchor="middle">Slide ${index + 1}</text>
  <text x="640" y="370" font-family="system-ui,sans-serif" font-size="24" fill="#64748b"
    text-anchor="middle">Processing… (pipeline not running)</text>
  <text x="640" y="420" font-family="system-ui,sans-serif" font-size="18" fill="#94a3b8"
    text-anchor="middle">${presentationId}</text>
</svg>`;

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=60",
    },
  });
}
