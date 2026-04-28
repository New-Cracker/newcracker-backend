// news/news.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { News } from '../entities/news.entity';
import { NewsDetailResponseDto } from '../dto/news-detail-response.dto';
import { RecentNewsResponseDto } from '../dto/recent-news-response.dto';
import { NewsResponseDto } from '../dto/news-response.dto';
import { NewsCrawlingService } from './news-crawling.service';
import { CompanyService } from 'src/company/company.service';
import { NewsDetailRequestDto } from '../dto/news-detail-request.dto';
import { PopularNewsResponseDto } from '../dto/popular-news-response.dto';
import { Category } from '../entities/enum/category.enum';
import { PaginatedNewsResponseDto } from '../dto/pagenatied-news-response.dto';
import { NewsCacheService } from './news-cache.service';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { AiService } from './ai.service';
import { SearchNewsResponseDto } from '../dto/search-news-response.dto';
import { Company } from 'src/company/entities/company.entity';

const ITEMS_PER_PAGE = 10;
const RECENT_NEWS_PREFIX = 'recent-news';
const MAX_RECENT_COUNT = 20;
const RECENT_NEWS_TTL = 7 * 24 * 60 * 60;

@Injectable()
export class NewsService {
  private readonly redis: Redis;

  constructor(
    @InjectRepository(News)
    private readonly newsRepository: Repository<News>,
    private readonly newsCacheService: NewsCacheService,
    private readonly newsCrawlingService: NewsCrawlingService,
    private readonly companyService: CompanyService,
    private readonly configService: ConfigService,
    private readonly aiService: AiService,
  ) {
    const isProd = this.configService.get('NODE_ENV') === 'prod';
    this.redis = new Redis({
      host: isProd ? this.configService.get<string>('REDIS_HOST') : '127.0.0.1',
      port: isProd ? this.configService.get<number>('REDIS_PORT') : 6379,
      password: this.configService.get<string>('REDIS_PASSWORD'),
      ...(isProd && {
        tls: { rejectUnauthorized: false },
      }),
    });
  }

  async getRecentNews(userId: number): Promise<RecentNewsResponseDto[]> {
    const key = `${RECENT_NEWS_PREFIX}:${userId}`;
    const newsIds = await this.redis.zrevrange(key, 0, MAX_RECENT_COUNT - 1);

    if (!newsIds.length) return [];

    const ids = newsIds.map(Number);
    const newsList = await this.newsRepository.find({
      where: { id: In(ids) },
      relations: ['company'],
    });

    const newsMap = new Map(newsList.map((n) => [n.id, n]));
    return ids
      .map((id) => newsMap.get(id))
      .filter((n): n is News => !!n)
      .map((n) => RecentNewsResponseDto.from(n));
  }

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

  async getDetail(
    dto: NewsDetailRequestDto,
    userId?: number,
  ): Promise<NewsDetailResponseDto> {
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

    await this.newsRepository.increment({ link: dto.link }, 'viewCount', 1);
    news!.viewCount += 1;

    if (userId) {
      console.log(
        `[RecentNews] Adding newsId=${news!.id} for userId=${userId}`,
      );
      await this.addRecentNews(userId, news!.id);
      console.log(`[RecentNews] Successfully added`);
    } else {
      console.log(`[RecentNews] userId is undefined, skipping`);
    }

    return NewsDetailResponseDto.from(news!);
  }

  async summarizeAndExtractKeyword(articleText: string): Promise<{
    aiSummary: string;
    keyword: string;
  }> {
    if (articleText.length < 100) return { aiSummary: '', keyword: '' };

    const prompt = this.buildNewsPrompt(articleText);
    const parsed = await this.aiService.generateJson<{
      summary: string;
      keyword: string;
    }>(prompt);

    return {
      aiSummary: parsed.summary ?? '',
      keyword: parsed.keyword ?? '',
    };
  }

  async getNewsTrend(category?: string): Promise<{ content: string }> {
    const prompt = this.buildTrendPrompt(category);
    const content = await this.aiService.generateText(prompt);
    return { content };
  }

  async search(query: string): Promise<SearchNewsResponseDto[]> {
    if (!query?.trim()) {
      throw new BadRequestException('검색어를 입력해주세요.');
    }

    const items = await this.newsCrawlingService.searchByQuery(query);
    return items.map((item) => SearchNewsResponseDto.from(item));
  }

  private async addRecentNews(userId: number, newsId: number): Promise<void> {
    const key = `${RECENT_NEWS_PREFIX}:${userId}`;
    const score = Date.now();

    await this.redis
      .multi()
      .zadd(key, score, String(newsId))
      .zremrangebyrank(key, 0, -(MAX_RECENT_COUNT + 1))
      .expire(key, RECENT_NEWS_TTL)
      .exec();
  }

  private async save(
    dto: NewsDetailRequestDto,
  ): Promise<NewsDetailResponseDto> {
    let company: Company | null = null;
    if (dto.companyName) {
      company = await this.companyService.findOrCreate(
        dto.companyName,
        dto.link,
      );
    }

    const articleText = await this.newsCrawlingService.fetchArticleText(
      dto.link,
    );
    const { aiSummary, keyword } =
      await this.summarizeAndExtractKeyword(articleText);
    const similarLinks = await this.newsCrawlingService.fetchByKeyword(keyword);

    const news = this.newsRepository.create({
      title: dto.title,
      category: dto.category,
      thumbnailUrl: dto.thumbnailUrl,
      summary: dto.summary,
      aiSummary: aiSummary,
      similarLinks: similarLinks,
      publicationDate: dto.publicationDate,
      link: dto.link,
      company,
    });

    const savedNews = await this.newsRepository.save(news);
    return NewsDetailResponseDto.from({ ...savedNews, company });
  }

  private buildTrendPrompt(category?: string): string {
    const currentDate = new Date().toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const categoryGuide = category
      ? `카테고리: "${category}"에 한정해서`
      : '카테고리 구분 없이 전체 분야에서';

    return `
오늘 날짜는 ${currentDate}입니다.

당신은 뉴스 트렌드를 분석하는 전문 에디터입니다.
이번 주에 이슈가 된 뉴스 주제들을 ${categoryGuide} 소개해주세요.

다음 형식을 정확히 따라주세요:
1. 첫 문단: 이번 주 트렌드를 전반적으로 요약하는 소개 멘트 (2~3문장)
2. 각 트렌드 항목: "* 트렌드 제목: 간단한 설명" 형식으로 5~7개
3. 마지막 문단: 마무리 멘트 (1~2문장)

절대 지켜야 할 규칙:
- 마크다운 문법(**, ##, --- 등) 사용 금지
- * 기호는 트렌드 항목 앞에만 사용
- 번호 매기기 없이 * 로만 항목 구분
- 자연스러운 한국어로 작성
- 추측이 아닌 실제 이슈 기반으로 작성
    `.trim();
  }

  private buildNewsPrompt(articleText?: string): string {
    return `
${articleText}를 읽고 뉴스를 5줄 내외로 요약하세요.

반드시 아래 JSON 형식으로만 응답하세요:
{"summary": "요약 내용", "keyword": "핵심 키워드"}

절대 지켜야 할 규칙:
- JSON 외 다른 텍스트 출력 금지
- 마크다운 문법(**, ##, --- 등) 사용 금지
- 자연스러운 한국어로 작성
- 추측이 아닌 실제 이슈 기반으로 작성
    `.trim();
  }
}
