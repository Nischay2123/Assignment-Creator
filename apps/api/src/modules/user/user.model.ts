import bcrypt from "bcrypt";
import jwt, { type SignOptions } from "jsonwebtoken";
import mongoose from "mongoose";

import type {
  JwtPayload,
  OtpPurpose,
  User,
  UserDocument,
  UserDocumentMethods,
  VerifyOtpResult
} from "../../common/types/user.types.js";
import { env } from "../../config/env.js";

const { Schema, model } = mongoose;

const UserSchema = new Schema<User, mongoose.Model<User, object, UserDocumentMethods>, UserDocumentMethods>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      select: false,
      minlength: 8,
      validate: {
        validator(value: string) {
          return /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(value);
        },
        message:
          "Password must be at least 8 characters long and contain at least one letter and one number"
      }
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    otpHash: {
      type: String,
      select: false
    },
    otpExpiry: {
      type: Date,
      select: false
    },
    otpAttempts: {
      type: Number,
      default: 0,
      select: false
    },
    otpPurpose: {
      type: String,
      enum: ["SIGNUP", "FORGOT_PASSWORD"],
      select: false
    }
  },
  {
    timestamps: true
  }
);

UserSchema.pre("save", async function (this: UserDocument) {
  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 10);
});

UserSchema.methods.isPasswordCorrect = async function (
  this: UserDocument,
  password: string
) {
  return bcrypt.compare(password, this.password);
};

UserSchema.methods.setOtp = async function (
  this: UserDocument,
  plainOtp: string,
  purpose: OtpPurpose
) {
  this.otpHash = await bcrypt.hash(plainOtp, 10);
  this.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
  this.otpAttempts = 0;
  this.otpPurpose = purpose;
};

UserSchema.methods.verifyOtp = async function (
  this: UserDocument,
  plainOtp: string
): Promise<VerifyOtpResult> {
  if (!this.otpExpiry || this.otpExpiry < new Date()) {
    return { valid: false, reason: "OTP_EXPIRED" };
  }

  if (this.otpAttempts >= 5) {
    return { valid: false, reason: "MAX_ATTEMPTS_EXCEEDED" };
  }

  if (!this.otpHash) {
    return { valid: false, reason: "INVALID_OTP" };
  }

  const isMatch = await bcrypt.compare(plainOtp, this.otpHash);

  if (!isMatch) {
    this.otpAttempts += 1;
    return { valid: false, reason: "INVALID_OTP" };
  }

  return { valid: true };
};

UserSchema.methods.clearOtp = function (this: UserDocument) {
  this.otpHash = undefined;
  this.otpExpiry = undefined;
  this.otpAttempts = 0;
  this.otpPurpose = undefined;
};

UserSchema.methods.generateAccessToken = function (this: UserDocument) {
  const payload: JwtPayload = {
    _id: this._id,
    email: this.email,
    name: this.name
  };

  return jwt.sign(payload, env.ACCESS_TOKEN_SECRET, {
    expiresIn: env.ACCESS_TOKEN_EXPIRY as SignOptions["expiresIn"]
  });
};

export const UserModel = model<User, mongoose.Model<User, object, UserDocumentMethods>>("User", UserSchema);
