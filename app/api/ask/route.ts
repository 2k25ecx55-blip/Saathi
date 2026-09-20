import { NextRequest, NextResponse } from "next/server";
import { AskApiRequest, AskApiResponse } from "@/lib/schema";
import { checkRateLimit } from "@/lib/limiter";
import { buildAskSystemPrompt } from "@/lib/prompt";
import { streamOllamaChat, OllamaChatMessage } from "@/lib/ollama";

export const dynamic = "force-dynamic";
export const maxDuration = 45;

export async function POST(request: NextRequest): Promise<NextResponse<AskApiResponse>> {
  // 1. Rate Limiting Check
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";

  const rateCheck = checkRateLimit(ip, 40, 60 * 1000);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: `Rate limit exceeded. Please wait ${rateCheck.resetInSeconds} seconds before asking again.`,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateCheck.resetInSeconds),
        },
      }
    );
  }

  try {
    const body = (await request.json()) as AskApiRequest;

    if (!body.question || !body.question.trim()) {
      return NextResponse.json(
        { success: false, error: "Question cannot be empty." },
        { status: 400 }
      );
    }

    const documentText = body.documentText || body.analysisSummary || "";
    if (!documentText.trim()) {
      return NextResponse.json(
        { success: false, error: "No document context available for follow-up questions." },
        { status: 400 }
      );
    }

    const language = body.language || "en";
    const systemPrompt = buildAskSystemPrompt(
      documentText,
      language,
      undefined,
      body.contacts || []
    );

    const messages: OllamaChatMessage[] = [
      { role: "system", content: systemPrompt },
    ];

    // Include recent conversational context (up to last 6 messages)
    if (Array.isArray(body.conversation)) {
      const recent = body.conversation.slice(-6);
      for (const msg of recent) {
        if (msg.role === "user" || msg.role === "assistant") {
          messages.push({
            role: msg.role,
            content: msg.content,
          });
        }
      }
    }

    // Append current question
    messages.push({
      role: "user",
      content: body.question.trim(),
    });

    // Call Ollama for streaming answer (unconstrained format, text response)
    const stream = await streamOllamaChat({
      messages,
      temperature: 0.1,
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (err: any) {
    // Security: never log document contents
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "An unexpected error occurred while generating the answer.",
      },
      { status: 500 }
    );
  }
}
