import { promisify } from 'util';
import { createClient } from 'redis';

class RedisClient {
  constructor() {
    this.client = createClient();
    this.isRedisConnected = true;

    this.client.on('error', (error) => {
      console.error(error.message);
      this.isRedisConnected = false;
    });

    this.client.on('connect', () => {
      this.isRedisConnected = true;
    });
  }

  isAlive() {
    return this.isRedisConnected;
  }

  async get(key) {
    const GET = await promisify(this.client.GET).bind(this.client);
    return GET(key);
  }

  async set(key, value, duration) {
    const SETEX = await promisify(this.client.SETEX).bind(this.client);
    SETEX(key, duration, value);
  }

  async del(key) {
    const DEL = await promisify(this.client.DEL).bind(this.client);
    DEL(key);
  }
}

export const redisClient = new RedisClient();
export default redisClient;
