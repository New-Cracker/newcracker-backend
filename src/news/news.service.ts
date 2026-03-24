// news/news.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { News } from './entities/news.entity';
import { NewsResponseDto } from './dto/news-response.dto';
import { LatestNewsResponseDto } from './dto/latest-news-response.dto';
import { NewsCrawlingService } from './news-crawling.service';
import { CompanyService } from './company.service';
import { GetNewsDetailRequestDto } from './dto/get-news-detail-request.dto';
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

  async getDetail(dto: GetNewsDetailRequestDto): Promise<NewsResponseDto> {
    let news = await this.newsRepository.findOne({
      where: { link: dto.link },
      relations: ['company'],
    });

    if (!news) {
      await this.save(dto);
      news = await this.newsRepository.findOne({
        where: { link: dto.link },
        relations: ['company'],
      });
    }

    // 위 두 경로 모두 news가 반드시 존재 — non-null assertion 사용
    await this.newsRepository.increment({ link: dto.link }, 'viewCount', 1);
    news!.viewCount += 1;

    return NewsResponseDto.from(news!);
  }

  private async save(dto: GetNewsDetailRequestDto): Promise<NewsResponseDto> {
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
