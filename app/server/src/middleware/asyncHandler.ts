import type { NextFunction, Request, RequestHandler, Response } from "express";

type AsyncRouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/**
 * Express doesn't automatically forward rejected promises from async
 * handlers to error middleware — without this, a thrown error inside an
 * `async (req, res) => {...}` route just hangs the request. Wrapping every
 * handler in this once means every route can `throw` a NotFoundError,
 * ValidationError, etc. and have it land in errorHandler.ts correctly.
 */
export function asyncHandler(handler: AsyncRouteHandler): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}
