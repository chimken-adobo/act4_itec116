import { Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { WeatherController } from './weather.controller';
import { WeatherService } from './weather.service';
import { WeatherLog } from './weather.entity';

@Module({
  imports: process.env.DB_ENABLED === 'true' ? [TypeOrmModule.forFeature([WeatherLog])] : [],
  controllers: [WeatherController],
  providers: [
    WeatherService,
    ...(process.env.DB_ENABLED === 'true'
      ? []
      : [
          {
            provide: getRepositoryToken(WeatherLog),
            useValue: {
              create: (data: any) => data,
              save: async () => undefined,
            },
          },
        ]),
  ],
})
export class WeatherModule {}
