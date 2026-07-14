import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

type ValidationTarget = "body" | "query" | "params";

/**
 * Validates and replaces req[target] with the parsed (and coerced) result
 * of the schema. Keeping this generic means every route declares its shape
 * once, in a validators/*.ts file, instead of hand-checking fields in the
 * route handler. Failures throw a ZodError, which errorHandler.ts already
 * knows how to format — no per-route try/catch needed.
 */
export function validate(schema: ZodSchema, target: ValidationTarget = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    req[target] = schema.parse(req[target]);
    next();
  };
}
