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

@Module({
  imports: [
    HttpModule,
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([News, Company]),
  ],
  controllers: [NewsController],
  providers: [NewsService, NewsCrawlingService, CompanyService],
  exports: [NewsService, NewsCrawlingService, CompanyService],
})
export class NewsModule {}
