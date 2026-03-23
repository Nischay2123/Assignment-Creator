import { Router } from "express";

import { authenticateJwt } from "../../common/middleware/authenticate-jwt.js";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { AssignmentController } from "./assignment.controller.js";

const assignmentController = new AssignmentController();

export const assignmentRoutes = Router();

assignmentRoutes.use(authenticateJwt);

assignmentRoutes.post("/", asyncHandler((req, res) =>
  assignmentController.create(req, res)
));
assignmentRoutes.get("/", asyncHandler((req, res) =>
  assignmentController.list(req, res)
));
assignmentRoutes.get("/:id", asyncHandler((req, res) =>
  assignmentController.getById(req, res)
));
assignmentRoutes.put("/:id", asyncHandler((req, res) =>
  assignmentController.update(req, res)
));
