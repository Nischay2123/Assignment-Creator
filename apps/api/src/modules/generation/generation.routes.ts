import { Router } from "express";

import { asyncHandler } from "../../common/utils/async-handler.js";
import { GenerationController } from "./generation.controller.js";

const generationController = new GenerationController();

export const generationRoutes = Router();

generationRoutes.post("/", asyncHandler((req, res) =>
  generationController.create(req, res)
));
generationRoutes.get("/", asyncHandler((req, res) =>
  generationController.list(req, res)
));
generationRoutes.get("/:id", asyncHandler((req, res) =>
  generationController.getById(req, res)
));
