import Redis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createRedisClient(): Redis {
  const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) return null; // stop retrying after 3 attempts
      return Math.min(times * 200, 1000);
    },
    lazyConnect: true,
  });

  redis.on("error", (err) => {
    if (process.env.NODE_ENV === "development") {
      // Suppress noisy Redis errors in dev when Redis isn't running
      if (!redis.status || redis.status === "connecting") return;
    }
    console.error("Redis connection error:", err.message);
  });

  // Attempt to connect but don't crash if it fails
  redis.connect().catch(() => {
    console.warn("[redis] Redis unavailable — features requiring Redis will be skipped");
  });

  return redis;
}

export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

export default redis;
