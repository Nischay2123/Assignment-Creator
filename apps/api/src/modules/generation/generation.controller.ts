import type { Request, Response } from "express";

import { HttpError } from "../../common/errors/http-error.js";
import type { ApiSuccessResponse } from "../../common/types/user.types.js";
import type {
  CreateGenerationInput,
  CreateGenerationResponse,
  GenerationPdfDownloadUrlResponse,
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
    if (!req.user) {
      throw new HttpError(401, "User not authenticated");
    }

    const payload: CreateGenerationInput = createGenerationSchema.parse(req.body);
    const result = await generationService.enqueueGeneration(payload, req.user.id);

    return res.status(201).json({ data: result });
  }

  async list(
    req: Request,
    res: Response<ApiSuccessResponse<GenerationResponse[]>>
  ) {
    if (!req.user) {
      throw new HttpError(401, "User not authenticated");
    }

    const result = await generationService.listGenerations(req.user.id);

    return res.status(200).json({ data: result });
  }

  async getById(
    req: Request,
    res: Response<ApiSuccessResponse<GenerationResponse>>
  ) {
    if (!req.user) {
      throw new HttpError(401, "User not authenticated");
    }

    const { id } = generationParamsSchema.parse(req.params);
    const result = await generationService.getGenerationById(id, req.user.id);

    return res.status(200).json({ data: result });
  }

  async getPdfDownloadUrl(
    req: Request,
    res: Response<ApiSuccessResponse<GenerationPdfDownloadUrlResponse>>
  ) {
    if (!req.user) {
      throw new HttpError(401, "User not authenticated");
    }

    const { id } = generationParamsSchema.parse(req.params);
    const result = await generationService.getPdfDownloadUrl(id, req.user.id);

    return res.status(200).json({ data: result });
  }

  async redirectToPdf(req: Request, res: Response) {
    if (!req.user) {
      throw new HttpError(401, "User not authenticated");
    }

    const { id } = generationParamsSchema.parse(req.params);
    const redirectUrl = await generationService.getPdfRedirectUrl(id, req.user.id);

    return res.redirect(302, redirectUrl);
  }

  async regeneratePdf(req: Request, res: Response<ApiSuccessResponse<GenerationResponse>>) {
    if (!req.user) {
      throw new HttpError(401, "User not authenticated");
    }

    const { id } = generationParamsSchema.parse(req.params);
    const result = await generationService.enqueuePdfRegeneration(id, req.user.id);

    return res.status(200).json({ data: result });
  }
}
