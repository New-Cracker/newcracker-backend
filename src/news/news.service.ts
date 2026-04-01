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
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';

const ITEMS_PER_PAGE = 10;

@Injectable()
export class NewsService {
  // GoogleGenerativeAI 인스턴스를 생성자에서 한 번만 생성
  // 기존: 호출마다 new GoogleGenerativeAI() → 내부 HTTP 클라이언트가 매번 생성되어 메모리 낭비
  private readonly model: GenerativeModel;

  constructor(
    @InjectRepository(News)
    private readonly newsRepository: Repository<News>,
    private readonly newsCacheService: NewsCacheService,
    private readonly newsCrawlingService: NewsCrawlingService,
    private readonly companyService: CompanyService,
    private readonly configService: ConfigService,
  ) {
    const genAI = new GoogleGenerativeAI(
      this.configService.getOrThrow<string>('GEMINI_API_KEY'),
    );
    this.model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
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

  async getDetail(dto: NewsDetailRequestDto): Promise<NewsDetailResponseDto> {
    let news = await this.newsRepository.findOne({
      where: { link: dto.link },
      relations: ['company'],
    });

    if (!news) {
      await this.save(dto);
      // save()가 이미 DB에 저장 후 엔티티를 반환하므로 재조회 불필요
      // relations 포함된 엔티티가 필요하므로 save 반환값 활용
      news = await this.newsRepository.findOne({
        where: { link: dto.link },
        relations: ['company'],
      });
    }

    await this.newsRepository.increment({ link: dto.link }, 'viewCount', 1);
    news!.viewCount += 1;

    return NewsDetailResponseDto.from(news!);
  }

  private async save(
    dto: NewsDetailRequestDto,
  ): Promise<NewsDetailResponseDto> {
    const company = await this.companyService.findOrCreate(
      dto.companyName,
      dto.link,
    );

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

  async summarizeAndExtractKeyword(articleText: string): Promise<{
    aiSummary: string;
    keyword: string;
  }> {
    if (articleText.length < 100) return { aiSummary: '', keyword: '' };

    const prompt = `
    다음 뉴스 기사를 분석해주세요.

    [기사 내용]
    ${articleText}

    [필수 조건]
    - 아래 JSON 형식으로만 반환할 것
    - 마크다운, 설명, 코드블록 일절 금지
    - keyword는 네이버 뉴스 검색에 사용할 핵심 키워드 1~2개

    {"summary": "10줄 이내 요약 텍스트", "keyword": "핵심 키워드"}
  `;

    // this.model 재사용 (생성자에서 초기화된 인스턴스)
    const result = await this.model.generateContent(prompt);
    const text = result.response.text().trim();
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim()) as {
      summary: string;
      keyword: string;
    };

    return {
      aiSummary: parsed.summary ?? '',
      keyword: parsed.keyword ?? '',
    };
  }
}
