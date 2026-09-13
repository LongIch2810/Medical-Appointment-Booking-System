import { Redis } from "ioredis";
import * as dotenv from "dotenv";
dotenv.config();

let client: Redis | undefined;

/**
 * Redis dùng chung cho rate limiter — bắt buộc để nhiều chatbot replica
 * (chạy sau cùng một backend) chia sẻ chung một quota per-user thay vì mỗi
 * process giữ bucket in-memory riêng.
 */
export function getRedisClient(): Redis {
  if (!client) {
    const commonOptions = {
      db: Number(process.env.REDIS_RATE_LIMIT_DB ?? 0),
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    };
    const redisUrl = process.env.REDIS_URL?.trim();

    client = redisUrl
      ? new Redis(redisUrl, commonOptions)
      : new Redis({
          host: process.env.REDIS_HOST ?? "127.0.0.1",
          port: Number(process.env.REDIS_PORT ?? 6379),
          password: process.env.REDIS_PASSWORD || undefined,
          tls: process.env.REDIS_TLS === "true" ? {} : undefined,
          ...commonOptions,
        });

    client.on("error", (error: NodeJS.ErrnoException) => {
      console.error(
        JSON.stringify({
          scope: "chatbot_redis_error",
          code: error.code || "REDIS_CONNECTION_ERROR",
        }),
      );
    });
  }
  return client;
}
