import { Router } from "express";

import { authRateLimiter } from "../../common/middleware/rate-limit.js";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { UserController } from "./user.controller.js";

const userController = new UserController();

export const userRoutes = Router();

userRoutes.post("/request-otp", authRateLimiter, asyncHandler((req, res) =>
  userController.register(req, res)
));
userRoutes.post("/verify-otp", authRateLimiter, asyncHandler((req, res) =>
  userController.verifyOtp(req, res)
));
userRoutes.post("/login", asyncHandler((req, res) =>
  userController.login(req, res)
));
userRoutes.post("/logout", asyncHandler((req, res) =>
  userController.logout(req, res)
));
