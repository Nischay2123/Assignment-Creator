import { Router } from "express";

import { authenticateJwt } from "../../common/middleware/authenticate-jwt.js";
import { resourceIntensiveRateLimiter } from "../../common/middleware/rate-limit.js";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { GenerationController } from "./generation.controller.js";

const generationController = new GenerationController();

export const generationRoutes = Router();

generationRoutes.use(authenticateJwt);

generationRoutes.post("/", asyncHandler((req, res) =>
  generationController.create(req, res)
));
generationRoutes.get("/", asyncHandler((req, res) =>
  generationController.list(req, res)
));
generationRoutes.post("/:id/pdf/regenerate", resourceIntensiveRateLimiter, asyncHandler((req, res) =>
  generationController.regeneratePdf(req, res)
));
generationRoutes.get("/:id/pdf-url", asyncHandler((req, res) =>
  generationController.getPdfDownloadUrl(req, res)
));
generationRoutes.get("/:id/pdf", asyncHandler((req, res) =>
  generationController.redirectToPdf(req, res)
));
generationRoutes.get("/:id", asyncHandler((req, res) =>
  generationController.getById(req, res)
));
