import { Module, Global, Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

const redisProvider: Provider = {
  inject: [ConfigService],
  provide: REDIS_CLIENT,
  useFactory: (configService: ConfigService) => {
    return new Redis({
      host: configService.get<string>('database.redis.host'),
      port: configService.get<number>('database.redis.port'),
      password:
        configService.get<string>('database.redis.password') ?? undefined,
      db: configService.get<number>('database.redis.db'),
    });
  },
};

@Global()
@Module({
  imports: [ConfigModule],
  providers: [redisProvider],
  exports: [redisProvider],
})
export class RedisModule {}
