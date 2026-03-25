import type {
  AIProvider,
  AIQuizRequest,
  AIQuizResult,
  GeneratedQuestion,
  QuizType,
  BloomLevel,
} from "@slideshow/shared";

interface GenerateQuizOptions {
  quizType: QuizType;
  difficulty: BloomLevel;
  count: number;
}

/**
 * Generate quiz questions from slide text using the specified AI provider.
 * Routes to Anthropic Claude or OpenAI GPT based on provider selection.
 */
export async function generateQuiz(
  provider: AIProvider,
  slideText: string,
  options: GenerateQuizOptions
): Promise<AIQuizResult> {
  switch (provider) {
    case "anthropic":
      return generateWithAnthropic(slideText, options);
    case "openai":
      return generateWithOpenAI(slideText, options);
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

function buildPrompt(slideText: string, options: GenerateQuizOptions): string {
  return `Generate ${options.count} ${options.quizType} quiz questions based on the following slide content.
Difficulty level: ${options.difficulty} (Bloom's Taxonomy).

Slide content:
${slideText}

Respond with valid JSON matching this schema:
{
  "questions": [
    {
      "question": "string",
      "type": "${options.quizType}",
      "options": [{ "text": "string", "isCorrect": boolean }],
      "correctAnswer": "string",
      "explanation": "string",
      "difficulty": "${options.difficulty}"
    }
  ]
}`;
}

async function generateWithAnthropic(
  slideText: string,
  options: GenerateQuizOptions
): Promise<AIQuizResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  const prompt = buildPrompt(slideText, options);

  // TODO: Replace with official Anthropic SDK for better typing and error handling
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Anthropic API error: ${response.status} - ${errorBody}`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text ?? "";
  const questions = parseQuizResponse(content);

  return { questions, provider: "anthropic" };
}

async function generateWithOpenAI(
  slideText: string,
  options: GenerateQuizOptions
): Promise<AIQuizResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const prompt = buildPrompt(slideText, options);

  // TODO: Replace with official OpenAI SDK for better typing and error handling
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a quiz generator. Always respond with valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 4096,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorBody}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? "";
  const questions = parseQuizResponse(content);

  return { questions, provider: "openai" };
}

/**
 * Parse AI response text into structured quiz questions.
 */
function parseQuizResponse(text: string): GeneratedQuestion[] {
  try {
    // Try to extract JSON from the response (may be wrapped in markdown code blocks)
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [
      null,
      text,
    ];
    const jsonStr = jsonMatch[1]?.trim() ?? text.trim();
    const parsed = JSON.parse(jsonStr);
    return parsed.questions ?? [];
  } catch {
    // TODO: Implement more robust parsing / retry logic
    console.error("Failed to parse AI quiz response:", text);
    return [];
  }
}
