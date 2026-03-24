import type { HydratedDocument, Types } from "mongoose";

export type OtpPurpose = "SIGNUP" | "FORGOT_PASSWORD";

export interface VerifyOtpResult {
  valid: boolean;
  reason?: "OTP_EXPIRED" | "MAX_ATTEMPTS_EXCEEDED" | "INVALID_OTP";
}

export interface UserDocumentMethods {
  isPasswordCorrect(password: string): Promise<boolean>;
  setOtp(plainOtp: string, purpose: OtpPurpose): Promise<void>;
  verifyOtp(plainOtp: string): Promise<VerifyOtpResult>;
  clearOtp(): void;
  generateAccessToken(): string;
}

export interface User {
  name: string;
  email: string;
  password: string;
  isEmailVerified: boolean;
  otpHash?: string;
  otpExpiry?: Date;
  otpAttempts: number;
  otpPurpose?: OtpPurpose;
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = HydratedDocument<User, UserDocumentMethods>;

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RequestOtpResponse {
  message: string;
  verificationRequired: true;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiSuccessResponse<T> {
  data: T;
}

export interface VerifyOtpSuccessResponse {
  message: string;
  user: UserResponse;
  token: string;
}

export interface LoginSuccessResponse {
  message: string;
  user: UserResponse;
  token: string;
}

export interface LogoutSuccessResponse {
  message: string;
}

export interface JwtPayload {
  _id: Types.ObjectId;
  email: string;
  name: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
}
