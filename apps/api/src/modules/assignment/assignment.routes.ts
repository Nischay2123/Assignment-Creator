import { Router } from "express";

import { asyncHandler } from "../../common/utils/async-handler.js";
import { AssignmentController } from "./assignment.controller.js";

const assignmentController = new AssignmentController();

export const assignmentRoutes = Router();

assignmentRoutes.post("/", asyncHandler((req, res) =>
  assignmentController.create(req, res)
));
assignmentRoutes.get("/", asyncHandler((req, res) =>
  assignmentController.list(req, res)
));
assignmentRoutes.get("/:id", asyncHandler((req, res) =>
  assignmentController.getById(req, res)
));
