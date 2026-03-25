import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { HttpError } from "../errors/http-error.js";
import { AUTH_COOKIE_NAME, clearAuthCookie } from "../utils/auth-cookie.js";
import { env } from "../../config/env.js";

const isAuthenticatedPayload = (
  payload: string | jwt.JwtPayload
): payload is jwt.JwtPayload & { _id: string; email: string; name: string } => {
  return typeof payload !== "string"
    && typeof payload._id === "string"
    && typeof payload.email === "string"
    && typeof payload.name === "string";
};

export const authenticateJwt = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const token = req.cookies?.[AUTH_COOKIE_NAME];

  if (!token) {
    clearAuthCookie(_res);
    return next(new HttpError(401, "Authentication required"));
  }

  try {
    const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET);

    if (!isAuthenticatedPayload(decoded)) {
      clearAuthCookie(_res);
      return next(new HttpError(401, "Invalid authentication token"));
    }

    req.user = {
      id: decoded._id.toString(),
      email: decoded.email,
      name: decoded.name
    };

    return next();
  } catch {
    clearAuthCookie(_res);
    return next(new HttpError(401, "Invalid or expired authentication token"));
  }
};
