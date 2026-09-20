import { NextRequest, NextResponse } from "next/server";
import { DocumentAnalysisSchema, AnalysisApiResponse, SupportedLanguage } from "@/lib/schema";
import { resolveAllDeadlines } from "@/lib/dates";
import { checkRateLimit } from "@/lib/limiter";
import {
  buildAnalyzeSystemPrompt,
  buildAnalyzeUserPrompt,
  buildRepairPrompt,
} from "@/lib/prompt";
import { callOllamaChat, extractJsonString, OllamaChatMessage } from "@/lib/ollama";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // 60s for local Ollama execution

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
  "application/pdf",
  "text/plain",
]);

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const pdfParse = require("pdf-parse");
    const data = await pdfParse(buffer);
    return data.text || "";
  } catch (err: any) {
    throw new Error(
      `Could not extract text from the PDF file: ${err?.message || "Corrupted or encrypted PDF"}`
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<AnalysisApiResponse>> {
  // 1. Rate Limiting Check
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";

  const rateCheck = checkRateLimit(ip, 30, 60 * 1000);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: `Rate limit exceeded. Please try again in ${rateCheck.resetInSeconds} seconds.`,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateCheck.resetInSeconds),
        },
      }
    );
  }

  let language: SupportedLanguage = "en";
  let documentText = "";
  let base64Image: string | null = null;

  try {
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const langParam = formData.get("language") as string | null;
      if (langParam === "hi" || langParam === "ta" || langParam === "en") {
        language = langParam;
      }

      const file = formData.get("file") as File | null;
      const textParam = formData.get("text") as string | null;

      if (file && file.size > 0) {
        if (file.size > MAX_FILE_SIZE_BYTES) {
          return NextResponse.json(
            { success: false, error: "File exceeds 5MB limit. Please upload a smaller photo or PDF." },
            { status: 400 }
          );
        }

        const mime = file.type.toLowerCase();
        if (!ALLOWED_MIME_TYPES.has(mime) && !mime.startsWith("image/")) {
          return NextResponse.json(
            { success: false, error: "Unsupported file type. Please upload JPG, PNG, WEBP, or PDF." },
            { status: 400 }
          );
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (mime === "application/pdf") {
          documentText = await extractTextFromPdf(buffer);
          if (!documentText.trim()) {
            return NextResponse.json(
              {
                success: false,
                error: "The uploaded PDF has no extractable text. If it is a scanned document, please export it as an image (JPG/PNG).",
              },
              { status: 400 }
            );
          }
        } else {
          // It's an image
          base64Image = buffer.toString("base64");
        }
      } else if (textParam && textParam.trim()) {
        documentText = textParam.trim();
      } else {
        return NextResponse.json(
          { success: false, error: "No document file or text was provided." },
          { status: 400 }
        );
      }
    } else {
      // JSON body
      const body = await request.json();
      if (body.language === "hi" || body.language === "ta" || body.language === "en") {
        language = body.language;
      }
      if (typeof body.text === "string" && body.text.trim()) {
        documentText = body.text.trim();
      } else {
        return NextResponse.json(
          { success: false, error: "Missing 'text' field in request body." },
          { status: 400 }
        );
      }
    }

    // 2. Prepare LLM Messages
    const systemPrompt = buildAnalyzeSystemPrompt(language);
    const messages: OllamaChatMessage[] = [{ role: "system", content: systemPrompt }];

    if (base64Image) {
      messages.push({
        role: "user",
        content: `Please read and explain this official document image in ${language}. Output JSON only following the schema.`,
        images: [base64Image],
      });
    } else {
      messages.push({
        role: "user",
        content: buildAnalyzeUserPrompt(documentText, language),
      });
    }

    // 3. Call LLM (Attempt 1)
    let rawOutput = await callOllamaChat({
      messages,
      format: "json",
      temperature: 0.1,
    });

    let cleanedJson = extractJsonString(rawOutput);
    let parsedJson: any = null;
    let parseError = "";

    try {
      parsedJson = JSON.parse(cleanedJson);
    } catch (e: any) {
      parseError = `JSON syntax error: ${e?.message}`;
    }

    let validationResult = parsedJson ? DocumentAnalysisSchema.safeParse(parsedJson) : null;

    // 4. Retry Once with Repair Instruction if Invalid
    if (!validationResult || !validationResult.success) {
      const errorMsg = parseError || JSON.stringify(validationResult?.error?.errors || "Invalid schema");
      const repairPrompt = buildRepairPrompt(rawOutput, errorMsg);

      messages.push({ role: "assistant", content: rawOutput });
      messages.push({ role: "user", content: repairPrompt });

      try {
        rawOutput = await callOllamaChat({
          messages,
          format: "json",
          temperature: 0.0,
        });
        cleanedJson = extractJsonString(rawOutput);
        parsedJson = JSON.parse(cleanedJson);
        validationResult = DocumentAnalysisSchema.safeParse(parsedJson);
      } catch (retryErr: any) {
        // Fallback: If still invalid, report error without revealing document content
        return NextResponse.json(
          {
            success: false,
            error: "Failed to parse structured analysis from local AI model. Please try again.",
          },
          { status: 502 }
        );
      }
    }

    if (!validationResult || !validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Model output could not be validated against required schema after repair attempt.",
        },
        { status: 502 }
      );
    }

    const validatedData = validationResult.data;

    // 5. Check Readability
    if (!validatedData.readable) {
      return NextResponse.json({
        success: true,
        data: validatedData,
        rawText: documentText || undefined,
      });
    }

    // 6. Deterministic Post-Processing (lib/dates.ts)
    // Resolve relative deadlines in code, never in the LLM
    const finalData = resolveAllDeadlines(validatedData);

    // Guarantee requested language field
    finalData.language = language;

    return NextResponse.json({
      success: true,
      data: finalData,
      rawText: documentText || undefined,
    });
  } catch (err: any) {
    // Security: Never log document contents or secrets
    const errorMessage = err?.message || "An unexpected error occurred during analysis.";
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
