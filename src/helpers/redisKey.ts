import { RedisKey } from "ioredis";
import { Types } from "mongoose";

export const redisId = (id: Types.ObjectId | undefined): RedisKey => {
  const validId: RedisKey = id?.toString() ?? "";

  return validId;
};
