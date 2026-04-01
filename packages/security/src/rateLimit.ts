import rateLimit from "express-rate-limit";
import { RateLimiterRedis, RateLimiterMemory } from "rate-limiter-flexible";
import Redis from "ioredis";

const redisClient = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL)
  : null;

const createRateLimiter = (options: {
  windowMs: number;
  maxRequests: number;
  keyPrefix?: string;
  message?: string;
}) => {
  const limiterOptions = {
    windowMs: options.windowMs,
    max: options.maxRequests,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: options.message || "Too many requests, please try again later.",
    keyGenerator: (req: any) => {
      return req.ip || req.headers["x-forwarded-for"] || "unknown";
    },
  };

  return rateLimit(limiterOptions);
};

export const rateLimiters = {
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: "Too many login attempts. Please try again in 15 minutes.",
  }),

  api: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    message: "API rate limit exceeded. Please slow down.",
  }),

  messaging: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    message: "Messaging rate limit exceeded.",
  }),

  upload: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    message: "Upload rate limit exceeded.",
  }),

  strict: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    message: "Strict rate limit. Please wait before making another request.",
  }),
};

export default rateLimiters;
