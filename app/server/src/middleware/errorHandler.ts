import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../lib/errors.js";

/**
 * Single place every error in the app funnels through. Keeps the JSON
 * error shape consistent across every route so the client only needs to
 * handle one contract: `{ error: { code, message, details? } }`.
 *
 * Must be registered AFTER every route/router (Express identifies error
 * middleware by its 4-argument signature).
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request failed validation.",
        details: err.flatten(),
      },
    });
    return;
  }

  // Anything else is unexpected — log full detail server-side, but never
  // leak internals (stack traces, SQL, etc.) to the client.
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Something went wrong. Please try again.",
    },
  });
}
