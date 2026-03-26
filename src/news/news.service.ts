// news/news.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { News } from './entities/news.entity';
import { NewsDetailResponseDto } from './dto/news-detail-response.dto';
import { NewsResponseDto } from './dto/news-response.dto';
import { NewsCrawlingService } from './services/news-crawling.service';
import { CompanyService } from 'src/company/company.service';
import { NewsDetailRequestDto } from './dto/news-detail-request.dto';
import { PopularNewsResponseDto } from './dto/popular-news-response.dto';
import { Category } from './entities/enum/category.enum';
import { PaginatedNewsResponseDto } from './dto/pagenatied-news-response.dto';
import { NewsCacheService } from './services/news-cache.service';

const ITEMS_PER_PAGE = 10;

@Injectable()
export class NewsService {
  constructor(
    @InjectRepository(News)
    private readonly newsRepository: Repository<News>,
    private readonly newsCacheService: NewsCacheService,
    private readonly newsCrawlingService: NewsCrawlingService,
    private readonly companyService: CompanyService,
  ) {}

  async findLatest(category?: string): Promise<NewsResponseDto[]> {
    const newsItems = await this.newsCrawlingService.fetchLatestNews(category);
    return newsItems.map((item) => NewsResponseDto.fromNaverItem(item));
  }

  async findPopular(): Promise<PopularNewsResponseDto[]> {
    const newsList = await this.newsRepository.find({
      order: { viewCount: 'DESC' },
      take: 5,
    });

    return newsList.map((news) => PopularNewsResponseDto.from(news));
  }

  async findNewsByCategory(
    category: Category,
    page: number = 1,
  ): Promise<PaginatedNewsResponseDto> {
    const newsItems = await this.newsCacheService.getByCategory(category);

    const totalItems = newsItems.length;
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const pagedItems = newsItems.slice(startIndex, endIndex);

    return PaginatedNewsResponseDto.of(
      pagedItems,
      totalItems,
      page,
      ITEMS_PER_PAGE,
    );
  }

  async getDetail(dto: NewsDetailRequestDto): Promise<NewsDetailResponseDto> {
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

    return NewsDetailResponseDto.from(news!);
  }

  private async save(
    dto: NewsDetailRequestDto,
  ): Promise<NewsDetailResponseDto> {
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
    return NewsDetailResponseDto.from({ ...savedNews, company });
  }
}
