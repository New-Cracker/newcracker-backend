import { Module } from '@nestjs/common';
import { NewsService } from './news.service';
import { NewsController } from './news.controller';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { News } from './entities/news.entity';
import { Company } from '../company/entities/company.entity';
import { NewsCrawlingService } from './services/news-crawling.service';
import { CompanyService } from 'src/company/company.service';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis-yet';
import { NewsCacheService } from './services/news-cache.service';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    HttpModule,
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([News, Company]),
    CacheModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        store: await redisStore(
          config.get('NODE_ENV') === 'prod'
            ? { url: config.get<string>('REDIS_URL') }
            : { host: '127.0.0.1', port: 6379 },
        ),
        ttl: 30 * 60 * 1000,
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
