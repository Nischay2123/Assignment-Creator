import { logger } from "@repo/logger";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { HttpError } from "../../common/errors/http-error.js";
import type {
  CreateGenerationInput,
  CreateGenerationResponse,
  GenerationPdfDownloadUrlResponse,
  GenerationDocument,
  GenerationResponse,
  PdfGenerationSocketEvent
} from "../../common/types/generation.types.js";
import { env } from "../../config/env.js";
import { AssignmentModel } from "../assignment/assignment.model.js";
import { publishGenerationEvent } from "./generation.events.js";
import { publishPdfGenerationEvent } from "./pdf.events.js";
import { GenerationModel } from "./generation.model.js";
import { GENERATION_QUEUE_NAME } from "./generation.constants.js";
import { addGenerationJob, addPdfGenerationJob } from "./generation.queue.js";

const generationLogger = logger.child({ module: "generation-service" });

const s3Client = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY
  }
});

const API_ORIGIN = env.API_PUBLIC_ORIGIN ?? `http://localhost:${env.PORT}`;

const parsePdfStorageUrl = (pdfUrl: string): { bucket: string; key: string } => {
  if (pdfUrl.startsWith("s3://")) {
    const withoutScheme = pdfUrl.slice("s3://".length);
    const slashIndex = withoutScheme.indexOf("/");

    if (slashIndex <= 0 || slashIndex === withoutScheme.length - 1) {
      throw new HttpError(500, "Invalid stored PDF location");
    }

    return {
      bucket: withoutScheme.slice(0, slashIndex),
      key: withoutScheme.slice(slashIndex + 1)
    };
  }

  try {
    const url = new URL(pdfUrl);
    const hostParts = url.hostname.split(".");

    // virtual-hosted-style: https://bucket.s3.region.amazonaws.com/key
    if (hostParts.length >= 4 && hostParts[1] === "s3") {
      const bucket = hostParts[0];
      const key = url.pathname.replace(/^\//, "");
      if (!bucket || !key) {
        throw new HttpError(500, "Invalid stored PDF location");
      }

      return {
        bucket,
        key
      };
    }

    // path-style: https://s3.region.amazonaws.com/bucket/key
    if (hostParts[0] === "s3") {
      const [bucket, ...rest] = url.pathname.replace(/^\//, "").split("/");
      const key = rest.join("/");

      if (!bucket || !key) {
        throw new HttpError(500, "Invalid stored PDF location");
      }

      return { bucket, key };
    }
  } catch {
    throw new HttpError(500, "Invalid stored PDF location");
  }

  throw new HttpError(500, "Invalid stored PDF location");
};

const createPresignedPdfUrl = async (pdfUrl: string): Promise<GenerationPdfDownloadUrlResponse> => {
  const { bucket, key } = parsePdfStorageUrl(pdfUrl);

  const url = await getSignedUrl(
    s3Client,
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      ResponseContentType: "application/pdf"
    }),
    { expiresIn: env.PDF_PRESIGNED_URL_TTL_SECONDS }
  );

  const expiresAt = new Date(
    Date.now() + env.PDF_PRESIGNED_URL_TTL_SECONDS * 1000
  ).toISOString();

  return { url, expiresAt };
};

export const toGenerationResponse = (
  generation: GenerationDocument
): GenerationResponse => {
  const redirectUrl =
    generation.pdfStatus === "generated"
      ? `${API_ORIGIN}/api/generations/${generation._id.toString()}/pdf`
      : generation.pdfUrl;

  return {
    id: generation._id.toString(),
    assignmentId: generation.assignmentId.toString(),
    version: generation.version,
    status: generation.status,
    result: generation.result,
    pdfUrl: redirectUrl,
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

    const latestGeneration = await GenerationModel.findOne({
      assignmentId: assignment._id
    }).sort({ version: -1 });
    const version = latestGeneration ? latestGeneration.version + 1 : 1;

    const generation = await GenerationModel.create({
      assignmentId: assignment._id,
      version,
      status: "queued",
      pdfStatus: "pending"
    });

    const job = await addGenerationJob({
      assignmentId: assignment._id.toString(),
      generationId: generation._id.toString()
    });

    const response = toGenerationResponse(generation);

    await publishGenerationEvent({
      assignmentId: assignment._id.toString(),
      status: "queued",
      generation: response
    });

    generationLogger.info("Generation request queued", {
      jobId: job.id?.toString(),
      assignmentId: assignment._id.toString(),
      generationId: generation._id.toString(),
      queueName: GENERATION_QUEUE_NAME
    });

    return {
      message: "Generation queued successfully.",
      generation: response,
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

  async getPdfDownloadUrl(id: string): Promise<GenerationPdfDownloadUrlResponse> {
    const generation = await GenerationModel.findById(id);

    if (!generation) {
      throw new HttpError(404, "Generation not found");
    }

    if (generation.pdfStatus !== "generated" || !generation.pdfUrl) {
      throw new HttpError(404, "PDF not generated yet");
    }

    return createPresignedPdfUrl(generation.pdfUrl);
  }

  async getPdfRedirectUrl(id: string): Promise<string> {
    const result = await this.getPdfDownloadUrl(id);
    return result.url;
  }

  async enqueuePdfRegeneration(id: string): Promise<GenerationResponse> {
    const generation = await GenerationModel.findById(id);

    if (!generation) {
      throw new HttpError(404, "Generation not found");
    }

    if (generation.status !== "completed" || !generation.result) {
      throw new HttpError(400, "Generation is not completed yet. Cannot regenerate PDF.");
    }

    // Update PDF status to pending for regeneration
    generation.pdfStatus = "pending";
    await generation.save();

    // Publish initial event
    const event: PdfGenerationSocketEvent = {
      generationId: generation._id.toString(),
      status: "pending"
    };
    await publishPdfGenerationEvent(event);

    // Queue the PDF generation job with force-regenerate flag
    const job = await addPdfGenerationJob({
      assignmentId: generation.assignmentId.toString(),
      generationId: generation._id.toString(),
      forceRegenerate: true
    });

    generationLogger.info("PDF regeneration queued", {
      jobId: job.id?.toString(),
      assignmentId: generation.assignmentId.toString(),
      generationId: generation._id.toString()
    });

    return toGenerationResponse(generation);
  }
}
