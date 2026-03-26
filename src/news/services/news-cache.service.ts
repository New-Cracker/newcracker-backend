import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { NewsCrawlingService } from './news-crawling.service';
import { NewsResponseDto } from '../dto/news-response.dto';
import { Category } from '../entities/enum/category.enum';

const CACHE_TTL = 30 * 60 * 1000; // 30분 (ms)
const CACHE_KEY_PREFIX = 'news';

@Injectable()
export class NewsCacheService {
  private readonly logger = new Logger(NewsCacheService.name);

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly newsCrawlingService: NewsCrawlingService,
  ) {}

  private getCacheKey(category: Category): string {
    return `${CACHE_KEY_PREFIX}:${category}`;
  }

  async getByCategory(category: Category): Promise<NewsResponseDto[]> {
    const key = this.getCacheKey(category);
    const cached = await this.cacheManager.get<NewsResponseDto[]>(key);

    if (cached) {
      return cached;
    }

    // 캐시 미스 → 빈 배열 즉시 반환 + 백그라운드에서 캐싱
    await this.fetchAndCache(category);

    return (await this.cacheManager.get<NewsResponseDto[]>(key)) ?? [];
  }

  async fetchAndCache(category: Category): Promise<void> {
    const key = this.getCacheKey(category);
    const newsItems = await this.newsCrawlingService.fetchByCategory(category);
    const dtos = newsItems.map((item) => NewsResponseDto.fromNaverItem(item));
    await this.cacheManager.set(key, dtos, CACHE_TTL);
  }
}
