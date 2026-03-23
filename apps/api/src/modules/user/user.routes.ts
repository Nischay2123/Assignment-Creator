import { Router } from "express";

import { asyncHandler } from "../../common/utils/async-handler.js";
import { UserController } from "./user.controller.js";

const userController = new UserController();

export const userRoutes = Router();

userRoutes.post("/request-otp", asyncHandler((req, res) =>
  userController.register(req, res)
));
userRoutes.post("/verify-otp", asyncHandler((req, res) =>
  userController.verifyOtp(req, res)
));
userRoutes.post("/login", asyncHandler((req, res) =>
  userController.login(req, res)
));
