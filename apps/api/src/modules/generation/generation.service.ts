import { logger } from "@repo/logger";

import { HttpError } from "../../common/errors/http-error.js";
import type {
  CreateGenerationInput,
  CreateGenerationResponse,
  GenerationDocument,
  GenerationResponse
} from "../../common/types/generation.types.js";
import { AssignmentModel } from "../assignment/assignment.model.js";
import { GenerationModel } from "./generation.model.js";
import { GENERATION_QUEUE_NAME } from "./generation.constants.js";
import { addGenerationJob } from "./generation.queue.js";

const generationLogger = logger.child({ module: "generation-service" });

export const toGenerationResponse = (
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

export class GenerationService {
  async enqueueGeneration(payload: CreateGenerationInput): Promise<CreateGenerationResponse> {
    const assignment = await AssignmentModel.findById(payload.assignmentId);

    if (!assignment) {
      throw new HttpError(404, "Assignment not found");
    }

    const job = await addGenerationJob({
      assignmentId: assignment._id.toString()
    });

    generationLogger.info("Generation request queued", {
      jobId: job.id?.toString(),
      assignmentId: assignment._id.toString(),
      queueName: GENERATION_QUEUE_NAME
    });

    return {
      message: "Generation queued successfully.",
      jobId: job.id?.toString() ?? "",
      queueName: GENERATION_QUEUE_NAME,
      assignmentId: assignment._id.toString()
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
