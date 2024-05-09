import { NextFunction, Request, Response } from "express";
import ApiError from "../middlewares/errors/apiError";

export function getEnvVariable(key: string, errorMessage: string): string {
  const value = process.env[key];
  if (!value) {
    throw new ApiError(errorMessage, 500);
  }
  return value;
}

export function ensureEnvVariables(
  keys: string[]
): (req: Request, res: Response, next: NextFunction) => void {
  return function (req: Request, res: Response, next: NextFunction): void {
    for (const key of keys) {
      if (!process.env[key]) {
        let errorMessage = "Internal server error. Please try again later.";
        if (process.env.NODE_ENV === "development") {
          errorMessage = `${key} is not defined. Please check your environment configuration.`;
        }
        const error: ApiError = new ApiError(errorMessage, 500);
        next(error);
        return;
      }
    }
    next();
  };
}
