import { Controller, Get, Query } from '@nestjs/common';
import { WeatherService } from './weather.service';

@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get()
  async getWeather(
    @Query('city') city?: string,
    @Query('lat') lat?: string,
    @Query('lon') lon?: string,
  ) {
    const latNum = lat !== undefined ? parseFloat(lat) : undefined;
    const lonNum = lon !== undefined ? parseFloat(lon) : undefined;
    return await this.weatherService.getWeather(city, latNum, lonNum);
  }

  @Get('geo')
  async getCitySuggestions(@Query('q') q: string) {
    return await this.weatherService.getCitySuggestions(q);
  }
}
