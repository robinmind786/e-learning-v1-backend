import { NextFunction, Request, Response } from "express";
import { Result, validationResult } from "express-validator";
import ApiError from "../errors/apiError";

interface ValidationError {
  msg: string;
}

export const runSchema = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors: Result<ValidationError> = validationResult(req);
  let errorMessage: string;

  if (!errors.isEmpty()) {
    errorMessage = errors.array()[0].msg;
    const statusCode: number = 422;

    const error = new ApiError(errorMessage, statusCode);
    next(error);
    return;
  }
  next();
};
