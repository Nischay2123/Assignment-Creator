import type { Request, Response } from "express";

import type { ApiSuccessResponse } from "../../common/types/user.types.js";
import type {
  AssignmentResponse,
  CreateAssignmentInput
} from "../../common/types/assignment.types.js";
import { AssignmentService } from "./assignment.service.js";
import {
  assignmentParamsSchema,
  createAssignmentSchema
} from "./assignment.validation.js";

const assignmentService = new AssignmentService();

export class AssignmentController {
  async create(
    req: Request,
    res: Response<ApiSuccessResponse<AssignmentResponse>>
  ) {
    const payload: CreateAssignmentInput = createAssignmentSchema.parse(req.body);
    const result = await assignmentService.createAssignment(payload);

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
}
