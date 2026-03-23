import { logger } from "@repo/logger";

import { HttpError } from "../../common/errors/http-error.js";
import { mailService } from "../../common/services/mail.service.js";
import type {
  CreateUserInput,
  LoginInput,
  LoginSuccessResponse,
  RequestOtpResponse,
  UserResponse,
  VerifyOtpSuccessResponse
} from "../../common/types/user.types.js";
import { UserModel } from "./user.model.js";

const userLogger = logger.child({ module: "user-service" });
const SIGNUP_OTP_EXPIRY_MINUTES = 10;

const toUserResponse = (user: {
  _id: { toString(): string };
  name: string;
  email: string;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}): UserResponse => {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
};

export class UserService {
  async registerUser(payload: CreateUserInput): Promise<RequestOtpResponse> {
    const normalizedEmail = payload.email.toLowerCase().trim();
    const existingUser = await UserModel.findOne({ email: normalizedEmail }).select("+password");

    if (existingUser && existingUser.isEmailVerified) {
      throw new HttpError(409, "User already exists");
    }

    let user = existingUser;
    let isExistingUnverified = false;

    if (!user) {
      user = new UserModel({
        ...payload,
        email: normalizedEmail,
        isEmailVerified: false
      });
    } else {
      isExistingUnverified = true;
      user.name = payload.name;
      user.password = payload.password;
      user.isEmailVerified = false;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    await user.setOtp(otp, "SIGNUP");
    await user.save();

    try {
      await mailService.sendSignupOtpEmail({
        to: normalizedEmail,
        name: user.name,
        otp,
        expiryMinutes: SIGNUP_OTP_EXPIRY_MINUTES
      });
    } catch (error: unknown) {
      userLogger.error("Failed to send signup OTP email", {
        email: normalizedEmail,
        error: error instanceof Error ? error.message : "Unknown error"
      });

      throw new HttpError(502, "Unable to send OTP email. Please try again");
    }

    userLogger.info("Signup OTP generated", {
      email: normalizedEmail,
      existingUnverified: isExistingUnverified
    });

    return {
      message: isExistingUnverified
        ? "Account exists but email is not verified. OTP sent to email"
        : "OTP sent to email",
      verificationRequired: true
    };
  }

  async verifyOtp(email: string, otp: string): Promise<VerifyOtpSuccessResponse> {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await UserModel.findOne({ email: normalizedEmail }).select(
      "+otpHash +otpExpiry +otpAttempts +otpPurpose +password"
    );

    if (!user) {
      throw new HttpError(404, "User not found");
    }

    if (user.isEmailVerified) {
      throw new HttpError(409, "User is already verified");
    }

    if (user.otpPurpose !== "SIGNUP") {
      throw new HttpError(400, "Invalid OTP purpose for signup verification");
    }

    const result = await user.verifyOtp(otp);

    if (!result.valid) {
      await user.save();

      throw new HttpError(400, "OTP verification failed", {
        reason: result.reason
      });
    }

    user.isEmailVerified = true;
    user.clearOtp();

    await user.save();

    const token = user.generateAccessToken();

    return {
      message: "User created successfully",
      user: toUserResponse(user),
      token
    };
  }

  async loginUser(payload: LoginInput): Promise<LoginSuccessResponse> {
    const normalizedEmail = payload.email.toLowerCase().trim();
    const user = await UserModel.findOne({ email: normalizedEmail }).select("+password");

    if (!user) {
      throw new HttpError(401, "Invalid email or password");
    }

    const isPasswordValid = await user.isPasswordCorrect(payload.password);

    if (!isPasswordValid) {
      throw new HttpError(401, "Invalid email or password");
    }

    if (!user.isEmailVerified) {
      throw new HttpError(403, "Email is not verified");
    }

    const token = user.generateAccessToken();

    userLogger.info("User logged in", {
      email: normalizedEmail
    });

    return {
      message: "Login successful",
      user: toUserResponse(user),
      token
    };
  }
}
