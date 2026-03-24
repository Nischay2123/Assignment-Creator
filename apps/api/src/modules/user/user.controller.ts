import type { Request, Response } from "express";

import type {
  ApiSuccessResponse,
  LoginSuccessResponse,
  LogoutSuccessResponse,
  RequestOtpResponse,
  VerifyOtpSuccessResponse
} from "../../common/types/user.types.js";
import { clearAuthCookie, setAuthCookie } from "../../common/utils/auth-cookie.js";
import { UserService } from "./user.service.js";
import {
  createUserSchema,
  loginSchema,
  type LoginInput,
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

    setAuthCookie(res, result.token);

    return res.status(200).json({ data: result });
  }

  async login(
    req: Request,
    res: Response<ApiSuccessResponse<LoginSuccessResponse>>
  ) {
    const payload: LoginInput = loginSchema.parse(req.body);
    const result = await userService.loginUser(payload);

    setAuthCookie(res, result.token);

    return res.status(200).json({ data: result });
  }

  async logout(
    _req: Request,
    res: Response<ApiSuccessResponse<LogoutSuccessResponse>>
  ) {
    clearAuthCookie(res);

    return res.status(200).json({
      data: {
        message: "Logged out successfully"
      }
    });
  }
}
