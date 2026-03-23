import type { Request, Response } from "express";

import type {
  ApiSuccessResponse,
  RequestOtpResponse,
  VerifyOtpSuccessResponse
} from "../../common/types/user.types.js";
import { UserService } from "./user.service.js";
import {
  createUserSchema,
  verifyOtpSchema,
  type VerifyOtpInput
} from "./user.validation.js";

const userService = new UserService();

export class UserController {

  async register(
    req: Request,
    res: Response<ApiSuccessResponse<RequestOtpResponse>>
  ) {
    const payload = createUserSchema.parse(req.body);
    const result = await userService.registerUser(payload);

    return res.status(200).json({ data: result });
  }

  async verifyOtp(
    req: Request,
    res: Response<ApiSuccessResponse<VerifyOtpSuccessResponse>>
  ) {
    const { email, otp }: VerifyOtpInput = verifyOtpSchema.parse(req.body);
    const result = await userService.verifyOtp(email, otp);

    return res.status(200).json({ data: result });
  }
}
