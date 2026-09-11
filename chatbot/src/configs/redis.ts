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
    client = new Redis({
      host: process.env.REDIS_HOST ?? "127.0.0.1",
      port: Number(process.env.REDIS_PORT ?? 6379),
      password: process.env.REDIS_PASSWORD || undefined,
      tls: process.env.REDIS_TLS === "true" ? {} : undefined,
      db: Number(process.env.REDIS_DB ?? 2),
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });
  }
  return client;
}
