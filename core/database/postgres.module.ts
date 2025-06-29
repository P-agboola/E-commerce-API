import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          type: 'postgres',
          host: configService.get('database.postgres.host'),
          port: configService.get('database.postgres.port'),
          username: configService.get('database.postgres.username'),
          password: configService.get('database.postgres.password'),
          database: configService.get('database.postgres.database'),
          entities: [__dirname + '/../../modules/**/*.entity{.ts,.js}'],
          migrations: [__dirname + '/../../migrations/*{.ts,.js}'],
          synchronize: configService.get('app.env') !== 'production',
          logging: configService.get('app.env') === 'development',
          namingStrategy: new SnakeNamingStrategy(),
          ssl:
            configService.get('app.env') === 'production'
              ? { rejectUnauthorized: false }
              : false,
        } as PostgresConnectionOptions;
      },
    }),
  ],
})
export class PostgresModule {}
