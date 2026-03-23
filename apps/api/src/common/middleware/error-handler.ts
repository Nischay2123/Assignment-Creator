import type { NextFunction, Request, Response } from "express";
import { logger } from "@repo/logger";
import { ZodError } from "zod";

import { HttpError } from "../errors/http-error.js";

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (error instanceof HttpError) {
    return res.status(error.statusCode).json({
      message: error.message,
      details: error.details
    });
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      message: "Validation failed",
      details: error.flatten()
    });
  }

  logger.error("Unhandled application error", {
    error: error instanceof Error ? error.message : "Unknown error"
  });

  return res.status(500).json({
    message: "Internal server error"
  });
};
