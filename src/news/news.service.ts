// news/news.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { News } from './entities/news.entity';
import { NewsResponseDto } from './dto/news-detail-response.dto';
import { LatestNewsResponseDto } from './dto/latest-news-response.dto';
import { NewsCrawlingService } from './news-crawling.service';
import { CompanyService } from './company.service';
import { SaveNewsRequestDto } from './dto/save-news-request.dto';
import { PopularNewsResponseDto } from './dto/popular-news-response.dto';

@Injectable()
export class NewsService {
  constructor(
    @InjectRepository(News)
    private readonly newsRepository: Repository<News>,
    private readonly newsCrawlingService: NewsCrawlingService,
    private readonly companyService: CompanyService,
  ) {}

  async findLatest(category?: string): Promise<LatestNewsResponseDto[]> {
    const newsItems = await this.newsCrawlingService.fetchLatestNews(category);
    return newsItems.map((item) => LatestNewsResponseDto.fromNaverItem(item));
  }

  async findPopular(): Promise<PopularNewsResponseDto[]> {
    const newsList = await this.newsRepository.find({
      order: { viewCount: 'DESC' },
      take: 5,
    });

    return newsList.map((news) => PopularNewsResponseDto.from(news));
  }

  async save(dto: SaveNewsRequestDto): Promise<NewsResponseDto> {
    // 이미 저장된 뉴스인지 확인 (link 기준 중복 체크)
    const existing = await this.newsRepository.findOne({
      where: { link: dto.link },
      relations: ['company'],
    });
    if (existing) return NewsResponseDto.from(existing);

    // 언론사 저장 or 조회
    const company = await this.companyService.findOrCreate(
      dto.companyName,
      dto.link,
    );

    // 뉴스 저장
    const news = this.newsRepository.create({
      title: dto.title,
      category: dto.category,
      thumbnailUrl: dto.thumbnailUrl,
      summary: dto.summary,
      publicationDate: dto.publicationDate,
      link: dto.link,
      company,
    });

    const savedNews = await this.newsRepository.save(news);
    return NewsResponseDto.from({ ...savedNews, company });
  }
}
