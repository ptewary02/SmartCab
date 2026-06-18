import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL, {
  //tls: {},              // required for Upstash
  maxRetriesPerRequest: 3,
});

redis.on('connect', () => console.log('Redis connected...'));
redis.on('error',   (e) => console.error('Redis error:', e));

export default redis;