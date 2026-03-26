import { logger } from "@repo/logger";

import type { AssignmentDocument } from "../../common/types/assignment.types.js";
import type {
  GenerateAssignmentResult,
  GenerateRawResponseResult,
  GenerationDocument,
  GenerationResult,
  GenerationJobData,
  GenerationResponse
} from "../../common/types/generation.types.js";
import { AssignmentModel } from "../assignment/assignment.model.js";
import { publishGenerationEvent } from "./generation.events.js";
import { GenerationLlmService } from "./generation-llm.service.js";
import { GenerationModel } from "./generation.model.js";
import { addPdfGenerationJob } from "./pdf.queue.js";
import {
  GenerationParseError,
  parseGenerationResponse
} from "./generation.parser.js";

const generationLogger = logger.child({ module: "worker-generation-processor" });
const generationLlmService = new GenerationLlmService();
const MAX_PARSE_RETRIES = 2;
const RETRY_BACKOFF_MS = [500, 1000] as const;

const toGenerationResponse = (
  generation: GenerationDocument
): GenerationResponse => {
  return {
    id: generation._id.toString(),
    assignmentId: generation.assignmentId.toString(),
    userId: generation.userId.toString(),
    version: generation.version,
    status: generation.status,
    result: generation.result,
    pdfUrl: generation.pdfUrl,
    pdfStatus: generation.pdfStatus,
    prompt: generation.prompt,
    rawResponse: generation.rawResponse,
    error: generation.error,
    processingTimeMs: generation.processingTimeMs,
    completedAt: generation.completedAt,
    createdAt: generation.createdAt,
    updatedAt: generation.updatedAt
  };
};

const buildPrompt = (assignment: AssignmentDocument): string => {
  const promptSourceMaterial = (() => {
    if (!assignment.sourceMaterial) {
      return null;
    }

    const sources: Array<{
      type: string;
      content: string;
    }> = [];

    // Add text source material if present
    if (assignment.sourceMaterial.text?.content) {
      sources.push({
        type: "text",
        content: assignment.sourceMaterial.text.content
      });
    }

    // Add file source material if extracted text is available
    // File is guaranteed to be processed or failed by this point
    if (assignment.sourceMaterial.file?.extractedText) {
      sources.push({
        type: "file",
        content: assignment.sourceMaterial.file.extractedText
      });
    } else if (assignment.sourceMaterial.file?.status === "failed") {
      generationLogger.warn("File extraction failed for assignment, proceeding without file data", {
        error: assignment.sourceMaterial.file.error
      });
    }

    if (sources.length === 0) {
      return null;
    }

    return sources.length === 1 ? sources[0] : sources;
  })();

  const assignmentPayload = {
    title: assignment.title,
    instructions: assignment.instructions,
    dueDate: assignment.dueDate.toISOString(),
    sections: assignment.sections.map((section) => ({
      sectionId: section.sectionId,
      title: section.title,
      instruction: section.instruction,
      questionConfig: {
        type: section.questionConfig.type,
        count: section.questionConfig.count,
        marksPerQuestion: section.questionConfig.marksPerQuestion,
        difficulty: section.questionConfig.difficulty
      }
    })),
    sourceMaterial: promptSourceMaterial
  };

  const outputSchema = {
    sections: [
      {
        sectionId: "string",
        title: "string",
        instruction: "string",
        questions: [
          {
            question: "string",
            type: "MCQ | SHORT | LONG",
            difficulty: "easy | medium | hard",
            marks: "number",
            options: ["string", "string", "string", "string"]
          }
        ]
      }
    ]
  };

return [
  "ROLE",
  "You are an AI exam generator that creates complete exam paper content from structured assignment inputs.",
  "",
  "STRICT_RULES",
  "1. Return only valid JSON.",
  "2. Do not include markdown, code fences, commentary, notes, or any extra text.",
  "3. The root object must exactly match the required schema.",
  "4. Preserve every input sectionId exactly as provided.",
  "5. Produce exactly the requested number of questions for each section.",
  "6. For every question, type must match the section questionConfig.type.",
  "7. For every question, difficulty must match the section questionConfig.difficulty.",
  "8. For every question, marks must match the section questionConfig.marksPerQuestion.",
  "9. Include options only for MCQ questions, and provide exactly 4 options.",
  "10. Do not add extra sections, omit sections, or rename fields.",
  "",
  "SOURCE_MATERIAL_RULES",
  "The sourceMaterial may contain ANY type of academic content, including:",
  "- syllabus (topics, chapters, objectives)",
  "- notes (concepts, summaries, formulas)",
  "- textbook content (detailed explanations)",
  "- question banks",
  "- or a mixture of all of the above",
  "",
  "You MUST:",
  "1. Carefully read and understand the content before generating questions.",
  "2. Identify key topics, concepts, definitions, and patterns from the material.",
  "3. Generate questions strictly based on the actual content provided.",
  "",
  "CONTENT_ADAPTATION_GUIDELINES",
  "- If content is syllabus-like → generate questions covering listed topics broadly.",
  "- If content is conceptual/notes → focus on understanding, definitions, and applications.",
  "- If content is detailed/theoretical → include deeper reasoning and long-form questions.",
  "- If content includes existing questions → rephrase or adapt them, do not copy directly.",
  "- If content is mixed → combine all strategies intelligently.",
  "",
  "CONTENT_GROUNDING_RULES",
  "- Do NOT generate questions unrelated to the provided material.",
  "- Do NOT hallucinate topics that are not present.",
  "- Prefer concepts explicitly mentioned in the content.",
  "",
  "NOISE_HANDLING_RULES",
  "- Ignore broken, irrelevant, or noisy text.",
  "- Focus only on meaningful and understandable parts of the content.",
  "",
  "FAILSAFE_RULE",
  "- If the content is unclear or insufficient, generate simple but relevant questions based on the closest identifiable topic.",
  "- Do NOT leave any section empty.",
  "",
  "REQUIRED_OUTPUT_SCHEMA",
  JSON.stringify(outputSchema, null, 2),
  "",
  "ASSIGNMENT_INPUT",
  JSON.stringify(assignmentPayload, null, 2),
  "",
  "FINAL_INSTRUCTION",
  "Generate the exam paper now and return only the JSON object."
].join("\n");
};

const sleep = async (ms: number): Promise<void> => {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

export class GenerationProcessor {
  private async generateWithRetry(
    assignment: AssignmentDocument,
    prompt: string
  ): Promise<GenerateAssignmentResult> {
    let lastRawResponse: string | undefined;
    let lastParseError: GenerationParseError | undefined;

    for (let attempt = 0; attempt <= MAX_PARSE_RETRIES; attempt += 1) {
      let llmResponse: GenerateRawResponseResult;

      try {
        llmResponse = await generationLlmService.generateAssignment(prompt);
      } catch (error) {
        throw error;
      }

      lastRawResponse = llmResponse.rawResponse;

      try {
        const result: GenerationResult = parseGenerationResponse(
          llmResponse.rawResponse,
          assignment
        );

        return {
          rawResponse: llmResponse.rawResponse,
          result
        };
      } catch (error) {
        if (!(error instanceof GenerationParseError)) {
          throw error;
        }

        lastParseError = error;

        generationLogger.warn("Generation response parsing failed", {
          assignmentId: assignment._id.toString(),
          attempt: attempt + 1,
          maxAttempts: MAX_PARSE_RETRIES + 1,
          error: error.message
        });

        if (attempt === MAX_PARSE_RETRIES) {
          break;
        }

        const retryDelayMs = attempt === 0 ? RETRY_BACKOFF_MS[0] : RETRY_BACKOFF_MS[1];
        await sleep(retryDelayMs);
      }
    }

    const parseError =
      lastParseError ?? new GenerationParseError("Generation response parsing failed");

    if (lastRawResponse) {
      (parseError as GenerationParseError & { rawResponse?: string }).rawResponse =
        lastRawResponse;
    }

    throw parseError;
  }

  async processJob(payload: GenerationJobData): Promise<GenerationResponse> {
    const generation = await GenerationModel.findById(payload.generationId);

    if (!generation) {
      throw new Error("Generation not found");
    }

    const assignment = await AssignmentModel.findById(payload.assignmentId);

    if (!assignment) {
      generation.status = "failed";
      generation.error = "Assignment not found";
      generation.completedAt = new Date();
      generation.processingTimeMs = 0;
      await generation.save();

      const missingAssignmentResponse = toGenerationResponse(generation);

      await publishGenerationEvent({
        assignmentId: payload.assignmentId,
        status: "failed",
        generation: missingAssignmentResponse,
        error: missingAssignmentResponse.error
      });

      throw new Error("Assignment not found");
    }

    const prompt = buildPrompt(assignment);
    const startedAt = Date.now();

    generationLogger.info("Generation processing started", {
      assignmentId: assignment._id.toString(),
      generationId: generation._id.toString()
    });

    generation.status = "processing";
    generation.prompt = prompt;
    generation.error = undefined;
    generation.completedAt = undefined;
    generation.processingTimeMs = undefined;
    await generation.save();

    await publishGenerationEvent({
      assignmentId: assignment._id.toString(),
      status: "processing",
      generation: toGenerationResponse(generation)
    });

    try {
      const llmResponse = await this.generateWithRetry(assignment, prompt);

      generation.status = "completed";
      generation.result = llmResponse.result;
      generation.rawResponse = llmResponse.rawResponse;
      generation.processingTimeMs = Date.now() - startedAt;
      generation.completedAt = new Date();
      generation.error = undefined;
      await generation.save();

      try {
        await addPdfGenerationJob({
          assignmentId: assignment._id.toString(),
          generationId: generation._id.toString()
        });
      } catch (queueError) {
        generation.pdfStatus = "failed";
        await generation.save();

        generationLogger.error("Failed to enqueue PDF generation job", {
          assignmentId: assignment._id.toString(),
          generationId: generation._id.toString(),
          error: queueError instanceof Error ? queueError.message : "Unknown error"
        });
      }

      const response = toGenerationResponse(generation);

      await publishGenerationEvent({
        assignmentId: assignment._id.toString(),
        status: "completed",
        generation: response
      });

      generationLogger.info("Generation processing completed", {
        assignmentId: assignment._id.toString(),
        generationId: response.id,
        processingTimeMs: generation.processingTimeMs,
        rawResponseLength: generation.rawResponse?.length
      });

      return response;
    } catch (error) {
      generation.status = "failed";
      generation.error = error instanceof Error ? error.message : "Unknown error";
      if (
        error instanceof GenerationParseError &&
        "rawResponse" in error &&
        typeof error.rawResponse === "string"
      ) {
        generation.rawResponse = error.rawResponse;
      }
      generation.processingTimeMs = Date.now() - startedAt;
      generation.completedAt = new Date();
      await generation.save();

      const response = toGenerationResponse(generation);

      await publishGenerationEvent({
        assignmentId: assignment._id.toString(),
        status: "failed",
        generation: response,
        error: response.error
      });

      generationLogger.error("Generation processing failed", {
        assignmentId: assignment._id.toString(),
        generationId: response.id,
        error: response.error,
        rawResponseLength: generation.rawResponse?.length
      });

      throw error;
    }
  }
}
