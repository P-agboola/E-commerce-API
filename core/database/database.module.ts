import { Module } from '@nestjs/common';
import { PostgresModule } from './postgres.module';
import { MongoModule } from './mongo.module';
import { RedisModule } from './redis.module';

@Module({
  imports: [PostgresModule, MongoModule, RedisModule],
  exports: [PostgresModule, MongoModule, RedisModule],
})
export class DatabaseModule {}
