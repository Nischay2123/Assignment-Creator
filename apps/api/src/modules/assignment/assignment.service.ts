import { logger } from "@repo/logger";

import { HttpError } from "../../common/errors/http-error.js";
import type {
  AssignmentFileSourceMaterial,
  AssignmentSourceMaterial,
  AssignmentDocument,
  AssignmentResponse,
  CreateAssignmentInput,
  UpdateAssignmentInput
} from "../../common/types/assignment.types.js";
import { AssignmentModel } from "./assignment.model.js";
import { FILE_PROCESSING_QUEUE_NAME } from "./file.constants.js";
import { addFileProcessingJob } from "./file.queue.js";
import { uploadAssignmentSourceFile } from "./file.service.js";

const assignmentLogger = logger.child({ module: "assignment-service" });

const toAssignmentResponse = (
  assignment: AssignmentDocument
): AssignmentResponse => {
  return {
    id: assignment._id.toString(),
    title: assignment.title,
    instructions: assignment.instructions,
    dueDate: assignment.dueDate,
    sections: assignment.sections,
    sourceMaterial: assignment.sourceMaterial,
    createdAt: assignment.createdAt,
    updatedAt: assignment.updatedAt
  };
};

export class AssignmentService {
  private async enqueueFileProcessing(
    assignmentId: string,
    fileUrl: string
  ): Promise<void> {
    const JOB_COMPLETION_TIMEOUT_MS = 70000; // 70s timeout (60s job + 10s buffer)
    const POLL_INTERVAL_MS = 500; // Check job status every 500ms
    const job = await addFileProcessingJob({
      assignmentId,
      fileUrl
    });

    assignmentLogger.info("File processing job queued", {
      assignmentId,
      fileUrl,
      queueName: FILE_PROCESSING_QUEUE_NAME,
      jobId: job.id?.toString()
    });

    try {
      // Poll for job completion with timeout
      const startTime = Date.now();
      let jobState = await job.getState();

      while (jobState !== "completed" && jobState !== "failed") {
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime > JOB_COMPLETION_TIMEOUT_MS) {
          throw new Error(`File processing timeout after ${JOB_COMPLETION_TIMEOUT_MS}ms`);
        }

        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
        jobState = await job.getState();
      }

      if (jobState === "failed") {
        throw new Error(
          `File processing job failed: ${job.failedReason || "Unknown error"}`
        );
      }

      // Refresh assignment to get updated file data
      const updatedAssignment = await AssignmentModel.findById(assignmentId);
      if (updatedAssignment?.sourceMaterial?.file?.status === "failed") {
        assignmentLogger.warn("File processing completed with failure status", {
          assignmentId,
          error: updatedAssignment.sourceMaterial.file.error
        });
      } else {
        assignmentLogger.info("File processing completed successfully", {
          assignmentId,
          hasExtractedText: !!updatedAssignment?.sourceMaterial?.file?.extractedText
        });
      }
    } catch (error) {
      // Job timed out or failed
      assignmentLogger.warn("File processing did not complete in time", {
        assignmentId,
        error: error instanceof Error ? error.message : "Unknown error"
      });

      // Mark as failed in assignment
      await AssignmentModel.findByIdAndUpdate(
        assignmentId,
        {
          "sourceMaterial.file.status": "failed",
          "sourceMaterial.file.error": "File processing timeout or worker unavailable"
        },
        { new: true }
      );

      throw error;
    }
  }

  async createAssignment(
    payload: CreateAssignmentInput,
    file?: Express.Multer.File
  ): Promise<AssignmentResponse> {
    const sourceMaterial: AssignmentSourceMaterial | undefined = {};

    // Add text source material if provided
    if (payload.sourceMaterial?.text) {
      sourceMaterial.text = payload.sourceMaterial.text;
    }

    const assignment = new AssignmentModel({
      title: payload.title,
      instructions: payload.instructions,
      dueDate: payload.dueDate,
      sections: payload.sections,
      sourceMaterial: Object.keys(sourceMaterial).length > 0 ? sourceMaterial : undefined
    });

    const assignmentId = assignment._id.toString();

    // Handle file upload - add to existing sourceMaterial or create new
    if (file) {
      const uploadedFile = await uploadAssignmentSourceFile(assignmentId, file);
      const fileSourceMaterial: AssignmentFileSourceMaterial = {
        fileUrl: uploadedFile.fileUrl,
        status: "pending"
      };

      if (!assignment.sourceMaterial) {
        assignment.sourceMaterial = {};
      }

      assignment.sourceMaterial.file = fileSourceMaterial;
    }

    await assignment.save();

    if (file && assignment.sourceMaterial?.file) {
      await this.enqueueFileProcessing(assignmentId, assignment.sourceMaterial.file.fileUrl);
    }

    return toAssignmentResponse(assignment);
  }

  async listAssignments(): Promise<AssignmentResponse[]> {
    const assignments = await AssignmentModel.find().sort({ createdAt: -1 });

    return assignments.map((assignment) => toAssignmentResponse(assignment));
  }

  async getAssignmentById(id: string): Promise<AssignmentResponse> {
    const assignment = await AssignmentModel.findById(id);

    if (!assignment) {
      throw new HttpError(404, "Assignment not found");
    }

    return toAssignmentResponse(assignment);
  }

  async updateAssignment(
    id: string,
    payload: UpdateAssignmentInput,
    file?: Express.Multer.File
  ): Promise<AssignmentResponse> {
    const assignment = await AssignmentModel.findById(id);

    if (!assignment) {
      throw new HttpError(404, "Assignment not found");
    }

    if (payload.instructions !== undefined) {
      assignment.instructions = payload.instructions;
    }

    // Update text source material if provided
    if (payload.sourceMaterial?.text) {
      if (!assignment.sourceMaterial) {
        assignment.sourceMaterial = {};
      }
      assignment.sourceMaterial.text = payload.sourceMaterial.text;
    }

    // Handle file upload - add to or update sourceMaterial
    if (file) {
      const uploadedFile = await uploadAssignmentSourceFile(id, file);

      if (!assignment.sourceMaterial) {
        assignment.sourceMaterial = {};
      }

      assignment.sourceMaterial.file = {
        fileUrl: uploadedFile.fileUrl,
        status: "pending",
        extractedText: undefined,
        error: undefined
      };
    }

    await assignment.save();

    if (file && assignment.sourceMaterial?.file) {
      await this.enqueueFileProcessing(id, assignment.sourceMaterial.file.fileUrl);
    }

    return toAssignmentResponse(assignment);
  }
}
