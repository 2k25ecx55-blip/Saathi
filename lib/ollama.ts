export interface OllamaChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
  images?: string[]; // base64 encoded image strings without data URL prefix
}

export interface OllamaChatResponse {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
  total_duration?: number;
}

export function getOllamaBaseUrl(): string {
  return process.env.OLLAMA_BASE_URL || "http://localhost:11434";
}

export function getOllamaModel(): string {
  return process.env.OLLAMA_MODEL || "qwen2.5:7b";
}

/**
 * Strips markdown code block wrappers (e.g. ```json ... ```) if the LLM wraps its output.
 */
export function extractJsonString(raw: string): string {
  let cleaned = raw.trim();

  // If wrapped in ```json ... ``` or ``` ... ```
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    cleaned = codeBlockMatch[1].trim();
  }

  // Find the first { and last }
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  return cleaned;
}

/**
 * Calls Ollama /api/chat with optional structured JSON formatting.
 */
export async function callOllamaChat({
  messages,
  format = "json",
  temperature = 0.1,
  model = getOllamaModel(),
}: {
  messages: OllamaChatMessage[];
  format?: "json" | undefined;
  temperature?: number;
  model?: string;
}): Promise<string> {
  const baseUrl = getOllamaBaseUrl().replace(/\/+$/, "");
  const endpoint = `${baseUrl}/api/chat`;

  const payload: Record<string, any> = {
    model,
    messages,
    stream: false,
    options: {
      temperature,
    },
  };

  if (format === "json") {
    payload.format = "json";
  }

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (err: any) {
    if (err?.cause?.code === "ECONNREFUSED" || err?.message?.includes("fetch failed")) {
      throw new Error(
        `Cannot connect to Ollama at ${baseUrl}. Please ensure Ollama is running (e.g. run 'ollama serve' or start the Ollama application).`
      );
    }
    throw new Error(`Failed to communicate with Ollama: ${err?.message || err}`);
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(
      `Ollama returned error ${response.status} (${response.statusText}): ${errorBody}`
    );
  }

  const data = (await response.json()) as OllamaChatResponse;
  if (!data.message || typeof data.message.content !== "string") {
    throw new Error("Unexpected response structure from Ollama API");
  }

  return data.message.content;
}

/**
 * Calls Ollama /api/chat and returns a streaming response.
 */
export async function streamOllamaChat({
  messages,
  temperature = 0.1,
  model = getOllamaModel(),
}: {
  messages: OllamaChatMessage[];
  temperature?: number;
  model?: string;
}): Promise<ReadableStream<Uint8Array>> {
  const baseUrl = getOllamaBaseUrl().replace(/\/+$/, "");
  const endpoint = `${baseUrl}/api/chat`;

  const payload: Record<string, any> = {
    model,
    messages,
    stream: true,
    options: {
      temperature,
    },
  };

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (err: any) {
    if (err?.cause?.code === "ECONNREFUSED" || err?.message?.includes("fetch failed")) {
      throw new Error(
        `Cannot connect to Ollama at ${baseUrl}. Please ensure Ollama is running.`
      );
    }
    throw new Error(`Failed to communicate with Ollama: ${err?.message || err}`);
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(
      `Ollama returned error ${response.status} (${response.statusText}): ${errorBody}`
    );
  }

  if (!response.body) {
    throw new Error("Ollama returned an empty response body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            if (parsed.message?.content) {
              controller.enqueue(encoder.encode(parsed.message.content));
            }
          } catch (e) {
            // Ignore parse errors on incomplete JSON chunks
          }
        }
      }
      
      if (buffer.trim()) {
        try {
          const parsed = JSON.parse(buffer);
          if (parsed.message?.content) {
            controller.enqueue(encoder.encode(parsed.message.content));
          }
        } catch (e) {}
      }
      
      controller.close();
    }
  });
}
