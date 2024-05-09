import { NextFunction, Response } from "express";
import { IUser } from "../models/user/userType";
import ApiError from "../middlewares/errors/apiError";
import { accessTokenOptions, refreshTokenOptions } from "./cookieOptions";
import redis from "../config/ioredis";
import { redisId } from "../helpers/redisKey";

export const sessionToken = async (
  user: IUser,
  statusCode: number,
  res: Response,
  next: NextFunction,
  redirectURL?: string
): Promise<void> => {
  user.password = undefined;

  const accessToken: string | undefined = user.signAccessToken?.();
  const refreshToken: string | undefined = user.signRefreshToken?.();

  const userCacheId = redisId(user._id);
  if (!userCacheId) {
    const error: ApiError = new ApiError(
      "Please login to access this resource",
      400
    );
    next(error);
    return;
  }

  await redis.set(userCacheId, JSON.stringify(user));

  res.cookie("access_token", accessToken, accessTokenOptions);
  res.cookie("refresh_token", refreshToken, refreshTokenOptions);

  if (redirectURL) {
    res.redirect(redirectURL);
  } else {
    res.status(statusCode).json({
      success: true,
      message: `Welcome back ${user.fname}.`,
      user,
      accessToken,
    });
  }
};
