import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WeatherLog } from './weather.entity';

@Injectable()
export class WeatherService {
  constructor(
    @InjectRepository(WeatherLog)
    private weatherRepo: Repository<WeatherLog>,
    private configService: ConfigService, // ✅ inject ConfigService
  ) {}

  async getWeather(city?: string, lat?: number, lon?: number) {
    const apiKey = this.configService.get<string>('OPENWEATHER_API_KEY');

    if (!apiKey) {
      throw new HttpException(
        'Server configuration error: missing OpenWeather API key',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      const params: Record<string, string | number> = { appid: apiKey, units: 'metric' };
      if (typeof lat === 'number' && typeof lon === 'number') {
        params.lat = lat;
        params.lon = lon;
      } else if (city) {
        params.q = city;
      } else {
        throw new HttpException('Missing query', HttpStatus.BAD_REQUEST);
      }

      const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', { params });

      const { temp } = response.data.main;
      const condition = response.data.weather[0].description;

      const resolvedCity = city || response.data.name || '';
      const log = this.weatherRepo.create({ city: resolvedCity, temperature: temp, condition });
      await this.weatherRepo.save(log);

      return { city: resolvedCity, temperature: temp, condition };
    } catch (error: any) {
      // Map OpenWeather errors to user-friendly HTTP errors
      if (axios.isAxiosError(error)) {
        const status = error.response?.status ?? 500;
        const owMessage =
          (error.response?.data as any)?.message || (error.response?.data as any)?.cod;

        if (status === 404) {
          throw new HttpException('City not found', HttpStatus.NOT_FOUND);
        }

        if (status === 401) {
          throw new HttpException('Invalid OpenWeather API key', HttpStatus.BAD_GATEWAY);
        }

        throw new HttpException(
          owMessage || 'Failed to fetch weather data',
          HttpStatus.BAD_GATEWAY,
        );
      }

      throw new HttpException('Unexpected error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getCitySuggestions(query: string) {
    const apiKey = this.configService.get<string>('OPENWEATHER_API_KEY');
    if (!apiKey) {
      throw new HttpException(
        'Server configuration error: missing OpenWeather API key',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      const response = await axios.get('https://api.openweathermap.org/geo/1.0/direct', {
        params: { q: query, limit: 5, appid: apiKey },
      });

      const items = Array.isArray(response.data) ? response.data : [];
      return items.map((it: any) => ({
        name: it.name,
        country: it.country,
        state: it.state,
        lat: it.lat,
        lon: it.lon,
        label: [it.name, it.state, it.country].filter(Boolean).join(', '),
      }));
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new HttpException('Failed to fetch suggestions', HttpStatus.BAD_GATEWAY);
      }
      throw new HttpException('Unexpected error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
