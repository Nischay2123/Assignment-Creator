import { logger } from "@repo/logger";

import type { AssignmentDocument } from "../../common/types/assignment.types.js";
import type {
  CreateGenerationJobResult,
  GenerationDocument,
  GenerationJobData,
  GenerationResponse
} from "../../common/types/generation.types.js";
import { AssignmentModel } from "../assignment/assignment.model.js";
import { publishGenerationEvent } from "./generation.events.js";
import { GenerationLlmService } from "./generation-llm.service.js";
import { GenerationModel } from "./generation.model.js";

const generationLogger = logger.child({ module: "worker-generation-processor" });
const generationLlmService = new GenerationLlmService();

const toGenerationResponse = (
  generation: GenerationDocument
): GenerationResponse => {
  return {
    id: generation._id.toString(),
    assignmentId: generation.assignmentId.toString(),
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

const buildPrompt = (assignment: AssignmentDocument) => {
  return JSON.stringify(
    {
      title: assignment.title,
      instructions: assignment.instructions,
      dueDate: assignment.dueDate,
      sections: assignment.sections,
      sourceMaterial: assignment.sourceMaterial
    },
    null,
    2
  );
};

export class GenerationProcessor {
  async processJob(payload: GenerationJobData): Promise<GenerationResponse> {
    const assignment = await AssignmentModel.findById(payload.assignmentId);

    if (!assignment) {
      throw new Error("Assignment not found");
    }

    const latestGeneration = await GenerationModel.findOne({
      assignmentId: assignment._id
    }).sort({ version: -1 });
    const version = latestGeneration ? latestGeneration.version + 1 : 1;
    const prompt = buildPrompt(assignment);
    const startedAt = Date.now();

    const generation = await GenerationModel.create({
      assignmentId: assignment._id,
      version,
      status: "processing",
      pdfStatus: "pending",
      prompt
    });

    await publishGenerationEvent({
      assignmentId: assignment._id.toString(),
      status: "processing",
      generation: toGenerationResponse(generation)
    });

    try {
      const llmResponse: CreateGenerationJobResult =
        await generationLlmService.generateAssignment(assignment, prompt);

      generation.status = "completed";
      generation.result = llmResponse.result;
      generation.rawResponse = llmResponse.rawResponse;
      generation.processingTimeMs = Date.now() - startedAt;
      generation.completedAt = new Date();
      generation.error = undefined;
      await generation.save();

      const response = toGenerationResponse(generation);

      await publishGenerationEvent({
        assignmentId: assignment._id.toString(),
        status: "completed",
        generation: response
      });

      return response;
    } catch (error) {
      generation.status = "failed";
      generation.error = error instanceof Error ? error.message : "Unknown error";
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
        error: response.error
      });

      throw error;
    }
  }
}
