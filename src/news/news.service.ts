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
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';

const ITEMS_PER_PAGE = 10;

@Injectable()
export class NewsService {
  constructor(
    @InjectRepository(News)
    private readonly newsRepository: Repository<News>,
    private readonly newsCacheService: NewsCacheService,
    private readonly newsCrawlingService: NewsCrawlingService,
    private readonly companyService: CompanyService,
    private readonly configService: ConfigService,
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
      await this.summarize(dto.link);
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

    const articleText = await this.newsCrawlingService.fetchArticleText(
      dto.link,
    );
    const aiSummary = await this.summarize(articleText);

    // 뉴스 저장
    const news = this.newsRepository.create({
      title: dto.title,
      category: dto.category,
      thumbnailUrl: dto.thumbnailUrl,
      summary: dto.summary,
      aiSummary: aiSummary,
      publicationDate: dto.publicationDate,
      link: dto.link,
      company,
    });

    const savedNews = await this.newsRepository.save(news);
    return NewsDetailResponseDto.from({ ...savedNews, company });
  }

  //gemini-2.5-flash 모델을 사용한 뉴스 요약
  async summarize(articleText: string): Promise<string> {
    if (!articleText) return '';

    const genAI = new GoogleGenerativeAI(
      this.configService.getOrThrow<string>('GEMINI_API_KEY'),
    );
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
      다음 뉴스 기사를 요약해주세요.
      
      [기사 내용]
      ${articleText}

      [필수 조건]
      - 요약한 내용만 반환할 것 (인삿말, 설명 등 일절 금지)
      - 마크다운 문법 사용 금지 (**, ##, - 등 금지)
      - 오로지 텍스트만 반환할 것
      - 10줄 이내로 작성할 것
    `;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  }
}
