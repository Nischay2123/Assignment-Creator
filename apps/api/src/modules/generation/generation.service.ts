import { logger } from "@repo/logger";

import { HttpError } from "../../common/errors/http-error.js";
import type { AssignmentDocument } from "../../common/types/assignment.types.js";
import type {
  CreateGenerationInput,
  CreateGenerationResponse,
  GenerationDocument,
  GenerationResponse
} from "../../common/types/generation.types.js";
import { AssignmentModel } from "../assignment/assignment.model.js";
import { GenerationModel } from "./generation.model.js";

const generationLogger = logger.child({ module: "generation-service" });

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

const buildPrompt = (assignment: AssignmentDocument, promptOverride?: string) => {
  if (promptOverride) {
    return promptOverride;
  }

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

export class GenerationService {
  async createGeneration(payload: CreateGenerationInput): Promise<CreateGenerationResponse> {
    const assignment = await AssignmentModel.findById(payload.assignmentId);

    if (!assignment) {
      throw new HttpError(404, "Assignment not found");
    }

    const latestGeneration = await GenerationModel.findOne({
      assignmentId: assignment._id
    }).sort({ version: -1 });

    const version = latestGeneration ? latestGeneration.version + 1 : 1;
    const prompt = buildPrompt(assignment, payload.promptOverride);

    const generation = await GenerationModel.create({
      assignmentId: assignment._id,
      version,
      status: "queued",
      pdfStatus: "pending",
      prompt
    });

    generationLogger.info("Generation request logged instead of queued", {
      generationId: generation._id.toString(),
      assignmentId: assignment._id.toString(),
      version,
      queuePlaceholder: true
    });

    return {
      message: "Generation created and logged. Queue integration is pending.",
      generation: toGenerationResponse(generation)
    };
  }

  async listGenerations(): Promise<GenerationResponse[]> {
    const generations = await GenerationModel.find().sort({ createdAt: -1 });

    return generations.map((generation) => toGenerationResponse(generation));
  }

  async getGenerationById(id: string): Promise<GenerationResponse> {
    const generation = await GenerationModel.findById(id);

    if (!generation) {
      throw new HttpError(404, "Generation not found");
    }

    return toGenerationResponse(generation);
  }
}
