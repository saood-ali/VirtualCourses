import Redis from "ioredis";

const getRedisClient = () => {
    if (!process.env.REDIS_URL) {
        console.warn("⚠️ REDIS_URL not found. Caching is disabled.");
        return null;
    }

    const client = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 1,
        connectTimeout: 10000,
        retryStrategy(times) {
            // Reconnect strategy: wait 2s, then 4s, etc. (max 20s)
            const delay = Math.min(times * 50, 2000);
            return delay;
        }
    });

    client.on("connect", () => console.log("✅ Production Redis Connected"));
    
    // Silent error logging to prevent app crashes
    client.on("error", (err) => {
        console.error("❌ Redis Connection Error (App will fallback to DB):", err.message);
    });

    return client;
};

const redis = getRedisClient();

//PRODUCTION CACHE HELPER
export const getOrSetCache = async (key, fetchCallback, expireTime = 3600) => {
    // If Redis isn't connected, skip caching and just fetch from DB
    if (!redis || redis.status !== "ready") {
        return await fetchCallback();
    }

    try {
        const cachedData = await redis.get(key);
        if (cachedData) {
            return JSON.parse(cachedData);
        }

        const freshData = await fetchCallback();
        
        if (freshData) {
            // "EX" = Expire in seconds
            await redis.set(key, JSON.stringify(freshData), "EX", expireTime);
        }

        return freshData;
    } catch (error) {
        console.error(`Cache Error on key ${key}:`, error);
        // if Redis fails, return data from DB 
        return await fetchCallback();
    }
};

export const clearCache = async (...keys) => {
    if (!redis || redis.status !== "ready") return;
    try {
        await redis.del(...keys);
    } catch (error) {
        console.error("Redis Clear Error:", error);
    }
};

export default redis;