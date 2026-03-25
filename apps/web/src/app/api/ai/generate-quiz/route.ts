import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { generateQuiz } from "@/lib/ai-providers";
import type { AIProvider, QuizType, BloomLevel } from "@slideshow/shared";

const VALID_PROVIDERS: AIProvider[] = ["anthropic", "openai"];
const VALID_QUIZ_TYPES: QuizType[] = [
  "MULTIPLE_CHOICE",
  "WORD_CLOUD",
  "SHORT_ANSWER",
  "FILL_IN_BLANK",
  "IMAGE_UPLOAD",
  "DRAWING",
];
const VALID_DIFFICULTIES: BloomLevel[] = [
  "remember",
  "understand",
  "apply",
  "analyze",
  "evaluate",
  "create",
];

const generateQuizSchema = z.object({
  slideText: z.string().min(10, "slideText must contain at least 10 characters"),
  provider: z.enum(["anthropic", "openai"]).optional().default("anthropic"),
  quizType: z
    .enum([
      "MULTIPLE_CHOICE",
      "WORD_CLOUD",
      "SHORT_ANSWER",
      "FILL_IN_BLANK",
      "IMAGE_UPLOAD",
      "DRAWING",
    ])
    .optional()
    .default("MULTIPLE_CHOICE"),
  difficulty: z
    .enum(["remember", "understand", "apply", "analyze", "evaluate", "create"])
    .optional()
    .default("understand"),
  count: z.number().int().min(1).max(10).optional().default(3),
});

/**
 * POST /api/ai/generate-quiz
 * Generate quiz questions from slide text using the specified AI provider.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = generateQuizSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { slideText, provider, quizType, difficulty, count } = parsed.data;

    const result = await generateQuiz(provider, slideText, {
      quizType,
      difficulty,
      count,
    });

    if (result.questions.length === 0) {
      return NextResponse.json(
        {
          error:
            "AI provider returned no valid questions. Try again or adjust the input.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      questions: result.questions,
      provider: result.provider,
      count: result.questions.length,
    });
  } catch (error) {
    console.error("POST /api/ai/generate-quiz error:", error);

    // Surface provider-specific errors
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("API key")) {
      return NextResponse.json(
        { error: "AI provider not configured. Please check API keys." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate quiz questions" },
      { status: 500 }
    );
  }
}
