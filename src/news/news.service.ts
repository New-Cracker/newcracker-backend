// news/news.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { News } from './entities/news.entity';
import { NewsResponseDto } from './dto/news-detail-response.dto';
import { LatestNewsResponseDto } from './dto/latest-news-response.dto';
import { NewsCrawlingService } from './news-crawling.service';

@Injectable()
export class NewsService {
  constructor(
    @InjectRepository(News)
    private readonly newsRepository: Repository<News>,
    private readonly newsCrawlingService: NewsCrawlingService,
  ) {}

  // async findById(id: number): Promise<NewsResponseDto> {
  //   const news = await this.newsRepository.findOne({
  //     where: { id },
  //     relations: ['company'], // company 조인
  //   });

  //   if (!news) throw new NotFoundException('존재하지 않는 뉴스입니다.');

  //   // 조회수 증가
  //   await this.newsRepository.update(id, { viewCount: news.viewCount + 1 });

  //   return NewsResponseDto.from(news);
  // }

  async findLatest(): Promise<LatestNewsResponseDto[]> {
    const newsItems = await this.newsCrawlingService.fetchLatestNews();
    return newsItems.map((item) => LatestNewsResponseDto.fromNaverItem(item));
  }
}
