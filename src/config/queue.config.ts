import { ConnectionOptions } from "bullmq";
import config from "./index";

export const redisQueueConnection: ConnectionOptions = config.redis.url
    ? {
        url: config.redis.url,
        maxRetriesPerRequest: null,
    }
    : {
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        maxRetriesPerRequest: null,
    };
