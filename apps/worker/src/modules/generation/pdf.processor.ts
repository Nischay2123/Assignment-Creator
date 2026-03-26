import { logger } from "@repo/logger";

import type { PdfGenerationJobData } from "../../common/types/generation.types.js";
import { uploadAssignmentPdfFile } from "../assignment/file.service.js";
import { GenerationModel } from "./generation.model.js";
import { PdfGenerationService } from "./pdf.generation.service.js";
import { publishPdfGenerationEvent } from "./pdf.events.js";

const pdfLogger = logger.child({ module: "worker-pdf-processor" });
const pdfGenerationService = new PdfGenerationService();

export class PdfProcessor {
  async processJob(payload: PdfGenerationJobData): Promise<void> {
    const generation = await GenerationModel.findById(payload.generationId);

    if (!generation) {
      throw new Error("Generation not found for PDF job");
    }

    const isForceRegenerate = payload.forceRegenerate === true;

    // Skip if PDF already exists and not forcing regeneration
    if (generation.pdfStatus === "generated" && generation.pdfUrl && !isForceRegenerate) {
      pdfLogger.info("Skipping PDF job because PDF already exists", {
        assignmentId: payload.assignmentId,
        generationId: payload.generationId,
        pdfUrl: generation.pdfUrl
      });
      return;
    }

    if (generation.status !== "completed" || !generation.result) {
      generation.pdfStatus = "failed";
      await generation.save();

      // Publish failure event
      await publishPdfGenerationEvent({
        generationId: generation._id.toString(),
        status: "failed",
        error: "Generation result is not ready for PDF generation"
      });

      throw new Error("Generation result is not ready for PDF generation");
    }

    try {
      // Publish generating event
      await publishPdfGenerationEvent({
        generationId: generation._id.toString(),
        status: "generating"
      });

      const pdfBuffer = await pdfGenerationService.generatePdfBuffer({
        version: generation.version,
        result: generation.result
      });

      const { fileUrl } = await uploadAssignmentPdfFile(
        payload.assignmentId,
        payload.generationId,
        pdfBuffer
      );

      generation.pdfStatus = "generated";
      generation.pdfUrl = fileUrl;
      await generation.save();

      // Publish completed event
      await publishPdfGenerationEvent({
        generationId: generation._id.toString(),
        status: "completed",
        pdfUrl: fileUrl
      });

      pdfLogger.info("PDF generated successfully", {
        assignmentId: payload.assignmentId,
        generationId: payload.generationId,
        pdfUrl: fileUrl,
        sizeBytes: pdfBuffer.length
      });
    } catch (error) {
      generation.pdfStatus = "failed";
      await generation.save();

      // Publish failure event
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      await publishPdfGenerationEvent({
        generationId: generation._id.toString(),
        status: "failed",
        error: errorMessage
      });

      pdfLogger.error("PDF generation failed", {
        assignmentId: payload.assignmentId,
        generationId: payload.generationId,
        error: errorMessage
      });

      throw error;
    }
  }
}
