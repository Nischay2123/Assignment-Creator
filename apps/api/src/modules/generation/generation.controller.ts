import type { Request, Response } from "express";

import type { ApiSuccessResponse } from "../../common/types/user.types.js";
import type {
  CreateGenerationInput,
  CreateGenerationResponse,
  GenerationResponse
} from "../../common/types/generation.types.js";
import { GenerationService } from "./generation.service.js";
import {
  createGenerationSchema,
  generationParamsSchema
} from "./generation.validation.js";

const generationService = new GenerationService();

export class GenerationController {
  async create(
    req: Request,
    res: Response<ApiSuccessResponse<CreateGenerationResponse>>
  ) {
    const payload: CreateGenerationInput = createGenerationSchema.parse(req.body);
    const result = await generationService.enqueueGeneration(payload);

    return res.status(201).json({ data: result });
  }

  async list(
    _req: Request,
    res: Response<ApiSuccessResponse<GenerationResponse[]>>
  ) {
    const result = await generationService.listGenerations();

    return res.status(200).json({ data: result });
  }

  async getById(
    req: Request,
    res: Response<ApiSuccessResponse<GenerationResponse>>
  ) {
    const { id } = generationParamsSchema.parse(req.params);
    const result = await generationService.getGenerationById(id);

    return res.status(200).json({ data: result });
  }
}
