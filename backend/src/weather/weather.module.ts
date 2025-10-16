import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WeatherController } from './weather.controller';
import { WeatherService } from './weather.service';
import { WeatherLog } from './weather.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WeatherLog])],  // ✅ THIS IS CRITICAL
  controllers: [WeatherController],
  providers: [WeatherService],
})
export class WeatherModule {}
