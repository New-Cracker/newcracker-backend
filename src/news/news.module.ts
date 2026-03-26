import { Module } from '@nestjs/common';
import { NewsService } from './news.service';
import { NewsController } from './news.controller';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { News } from './entities/news.entity';
import { Company } from './entities/company.entity';
import { NewsCrawlingService } from './news-crawling.service';
import { CompanyService } from './company.service';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis-yet';
import { NewsCacheService } from './news-cache.service';

@Module({
  imports: [
    HttpModule,
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([News, Company]),
    CacheModule.registerAsync({
      useFactory: async () => ({
        store: await redisStore({
          host: process.env.REDIS_HOST ?? 'localhost',
          port: Number(process.env.REDIS_PORT ?? 6379),
        }),
        ttl: 30 * 60 * 1000, // 30분 (ms)
      }),
    }),
  ],
  controllers: [NewsController],
  providers: [
    NewsService,
    NewsCrawlingService,
    CompanyService,
    NewsCacheService,
  ],
  exports: [NewsService, NewsCrawlingService, CompanyService, NewsCacheService],
})
export class NewsModule {}
