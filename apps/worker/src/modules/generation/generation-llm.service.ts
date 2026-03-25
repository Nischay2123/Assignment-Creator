import { logger } from "@repo/logger";

import type { GenerateRawResponseResult } from "../../common/types/generation.types.js";
import { env } from "../../config/env.js";

interface GeminiErrorResponse {
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
}

interface GeminiResponsePart {
  text?: string;
}

interface GeminiResponseContent {
  parts?: GeminiResponsePart[];
}

interface GeminiCandidate {
  content?: GeminiResponseContent;
  finishReason?: string;
}

interface GeminiGenerateContentResponse extends GeminiErrorResponse {
  candidates?: GeminiCandidate[];
}

const generationLlmLogger = logger.child({ module: "worker-generation-llm-service" });
const GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

export class GenerationLlmService {
  async generateAssignment(prompt: string): Promise<GenerateRawResponseResult> {
    if (!env.GEMINI_API_KEY.trim()) {
      throw new Error("Gemini API key is not configured");
    }

    const abortController = new AbortController();
    const timeoutHandle = setTimeout(() => {
      abortController.abort();
    }, env.GEMINI_TIMEOUT_MS);

    const requestUrl = `${GEMINI_API_BASE_URL}/models/${env.GEMINI_MODEL}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`;

    generationLlmLogger.info("Sending generation request to Gemini", {
      model: env.GEMINI_MODEL,
      timeoutMs: env.GEMINI_TIMEOUT_MS
    });

    try {
      const response = await fetch(requestUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0,
            responseMimeType: "application/json"
          }
        }),
        signal: abortController.signal
      });

      const responseText = await response.text();
      let responseBody: GeminiGenerateContentResponse | undefined;

      if (responseText.trim()) {
        try {
          responseBody = JSON.parse(responseText) as GeminiGenerateContentResponse;
        } catch {
          responseBody = undefined;
        }
      }

      if (!response.ok) {
        const upstreamError =
          responseBody?.error?.message ?? `Gemini request failed with status ${response.status}`;

        generationLlmLogger.error("Gemini generation request failed", {
          model: env.GEMINI_MODEL,
          status: response.status,
          error: upstreamError
        });

        throw new Error(upstreamError);
      }

      const rawResponse = this.extractTextResponse(responseBody);

      generationLlmLogger.info("Received generation response from Gemini", {
        model: env.GEMINI_MODEL,
        responseLength: rawResponse.length
      });

      return { rawResponse };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        generationLlmLogger.error("Gemini generation request timed out", {
          model: env.GEMINI_MODEL,
          timeoutMs: env.GEMINI_TIMEOUT_MS
        });
        throw new Error(`Gemini request timed out after ${env.GEMINI_TIMEOUT_MS}ms`);
      }

      generationLlmLogger.error("Gemini generation request errored", {
        model: env.GEMINI_MODEL,
        error: error instanceof Error ? error.message : "Unknown error"
      });

      throw error;
    } finally {
      clearTimeout(timeoutHandle);
    }
  }

  private extractTextResponse(
    responseBody: GeminiGenerateContentResponse | undefined
  ): string {
    const contentText = responseBody?.candidates
      ?.flatMap((candidate) => candidate.content?.parts ?? [])
      .map((part) => part.text?.trim() ?? "")
      .filter((part) => part.length > 0)
      .join("\n")
      .trim();

    if (contentText) {
      return contentText;
    }

    throw new Error("Gemini response did not include readable text output");
  }
}
