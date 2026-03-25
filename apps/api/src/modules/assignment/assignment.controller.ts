import type { Request, Response } from "express";

import { HttpError } from "../../common/errors/http-error.js";
import type { ApiSuccessResponse } from "../../common/types/user.types.js";
import type {
  AssignmentResponse,
  CreateAssignmentInput,
  UpdateAssignmentInput
} from "../../common/types/assignment.types.js";
import { AssignmentService } from "./assignment.service.js";
import {
  assignmentParamsSchema,
  createAssignmentSchema,
  updateAssignmentSchema
} from "./assignment.validation.js";

const assignmentService = new AssignmentService();

const parseJsonIfString = (value: unknown): unknown => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return value;
  }

  if (
    (trimmedValue.startsWith("{") && trimmedValue.endsWith("}")) ||
    (trimmedValue.startsWith("[") && trimmedValue.endsWith("]"))
  ) {
    try {
      return JSON.parse(trimmedValue);
    } catch {
      throw new HttpError(400, "Invalid JSON payload in multipart request");
    }
  }

  return value;
};

const normalizeAssignmentBody = (body: Request["body"]): Record<string, unknown> => {
  const normalizedBody: Record<string, unknown> = { ...body };

  if (Object.prototype.hasOwnProperty.call(normalizedBody, "sections")) {
    normalizedBody.sections = parseJsonIfString(normalizedBody.sections);
  }

  if (Object.prototype.hasOwnProperty.call(normalizedBody, "sourceMaterial")) {
    normalizedBody.sourceMaterial = parseJsonIfString(normalizedBody.sourceMaterial);
  }

  return normalizedBody;
};

export class AssignmentController {
  async create(
    req: Request,
    res: Response<ApiSuccessResponse<AssignmentResponse>>
  ) {
    const normalizedBody = normalizeAssignmentBody(req.body);
    const payload: CreateAssignmentInput = createAssignmentSchema.parse(normalizedBody);

    if (req.file && !payload.sourceMaterial?.text) {
      // File upload without text source material is allowed
      // Just ensure sourceMaterial is initialized
      if (!payload.sourceMaterial) {
        payload.sourceMaterial = {};
      }
    }

    const result = await assignmentService.createAssignment(payload, req.file);

    return res.status(201).json({ data: result });
  }

  async list(
    _req: Request,
    res: Response<ApiSuccessResponse<AssignmentResponse[]>>
  ) {
    const result = await assignmentService.listAssignments();

    return res.status(200).json({ data: result });
  }

  async getById(
    req: Request,
    res: Response<ApiSuccessResponse<AssignmentResponse>>
  ) {
    const { id } = assignmentParamsSchema.parse(req.params);
    const result = await assignmentService.getAssignmentById(id);

    return res.status(200).json({ data: result });
  }

  async update(
    req: Request,
    res: Response<ApiSuccessResponse<AssignmentResponse>>
  ) {
    const { id } = assignmentParamsSchema.parse(req.params);
    const normalizedBody = normalizeAssignmentBody(req.body);
    const payload: UpdateAssignmentInput = updateAssignmentSchema.parse(normalizedBody);

    if (req.file && !payload.sourceMaterial?.text) {
      // File upload without text source material is allowed
      // Just ensure sourceMaterial is initialized
      if (!payload.sourceMaterial) {
        payload.sourceMaterial = {};
      }
    }

    const result = await assignmentService.updateAssignment(id, payload, req.file);

    return res.status(200).json({ data: result });
  }
}
