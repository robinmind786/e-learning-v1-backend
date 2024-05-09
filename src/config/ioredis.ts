import Redis from "ioredis";
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

const redisClient = function (): string {
  const client = process.env.REDIS_URL ?? "";

  console.log("Redis connected");
  return client;
};

const redis = new Redis(redisClient());
export default redis;
