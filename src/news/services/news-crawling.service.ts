// news/news-crawling.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { NewsItem } from '../interfaces/news-item.interface';
import { NewsResponse } from '../interfaces/news-response.interface';
import { Category } from '../entities/enum/category.enum';
import * as cheerio from 'cheerio';

//네이버 뉴스에서 카테고리 검색 기능은 지원하지 않음
//키워드 검색을 이용할 것임
const CATEGORY_QUERY_MAP: Record<string, string> = {
  POLITICS: '정치',
  ECONOMY: '경제',
  SOCIETY: '사회',
  LIFE: '생활 문화',
  IT_SCIENCE: 'IT 과학',
  WORLD: '세계',
};

@Injectable()
export class NewsCrawlingService {
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.clientId = this.configService.get<string>('NAVER_CLIENT_ID') ?? '';
    this.clientSecret =
      this.configService.get<string>('NAVER_CLIENT_SECRET') ?? '';
  }

  async fetchLatestNews(category?: string): Promise<NewsItem[]> {
    try {
      //뉴스 -> 최신 뉴스 조회를 위한 일종의 편법
      const query = CATEGORY_QUERY_MAP[category?.toUpperCase() ?? ''] ?? '뉴스';

      const response = await firstValueFrom(
        this.httpService.get<NewsResponse>(
          'https://openapi.naver.com/v1/search/news.json',
          {
            params: {
              query, // 전체 최신 뉴스
              display: 5,
              sort: 'date', // 최신순
            },
            headers: {
              'X-Naver-Client-Id': this.clientId,
              'X-Naver-Client-Secret': this.clientSecret,
            },
          },
        ),
      );

      const newsItems = await Promise.all(
        response.data.items.map(async (item) => {
          const { thumbnailUrl, companyName } = await this.fetchMetadata(
            item.link,
          );
          const category = await this.categorizeNews(
            item.title,
            item.description,
          );
          return {
            ...item,
            title: this.decodeHtmlEntities(item.title).replace(/<[^>]*>/g, ''),
            description: this.decodeHtmlEntities(item.description).replace(
              /<[^>]*>/g,
              '',
            ),
            thumbnailUrl,
            companyName,
            category: category,
          };
        }),
      );

      return newsItems;
    } catch {
      throw new InternalServerErrorException(
        '네이버 뉴스 API 호출에 실패했습니다.',
      );
    }
  }

  async fetchByCategory(category: Category): Promise<NewsItem[]> {
    try {
      const query = CATEGORY_QUERY_MAP[category] ?? '뉴스';
      const result: NewsItem[] = [];
      let start = 1;
      const FETCH_SIZE = 10;
      const TOTAL_ITEMS = 100;
      const MAX_START = 1000;

      while (result.length < TOTAL_ITEMS && start <= MAX_START) {
        const response = await firstValueFrom(
          this.httpService.get<NewsResponse>(
            'https://openapi.naver.com/v1/search/news.json',
            {
              params: { query, display: FETCH_SIZE, start, sort: 'date' },
              headers: {
                'X-Naver-Client-Id': this.clientId,
                'X-Naver-Client-Secret': this.clientSecret,
              },
            },
          ),
        );

        const items = response.data.items;
        if (!items.length) break;

        const classifiedItems = await Promise.allSettled(
          items.map(async (item) => {
            const [{ thumbnailUrl, companyName }, classifiedCategory] =
              await Promise.all([
                this.fetchMetadata(item.link),
                this.categorizeNews(item.title, item.description),
              ]);
            return {
              ...item,
              title: this.decodeHtmlEntities(item.title).replace(
                /<[^>]*>/g,
                '',
              ),
              description: this.decodeHtmlEntities(item.description).replace(
                /<[^>]*>/g,
                '',
              ),
              thumbnailUrl,
              companyName,
              category: classifiedCategory,
            };
          }),
        );
        const matched = classifiedItems
          .filter(
            (r): r is PromiseFulfilledResult<NewsItem> =>
              r.status === 'fulfilled',
          )
          .map((r) => r.value)
          .filter((item) => item.category === category);

        result.push(...matched);
        start += FETCH_SIZE;
      }

      return result.slice(0, 100);
    } catch {
      throw new InternalServerErrorException(
        '카테고리별 뉴스 API 호출에 실패했습니다.',
      );
    }
  }

  private async fetchMetadata(
    link: string,
  ): Promise<{ thumbnailUrl: string; companyName: string }> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<string>(link, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          responseType: 'text',
        }),
      );

      const html = response.data;

      const imageMatch =
        /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i.exec(
          html,
        ) ??
        /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i.exec(
          html,
        );

      const siteNameMatch =
        /<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i.exec(
          html,
        ) ??
        /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:site_name["']/i.exec(
          html,
        );

      return {
        thumbnailUrl: imageMatch?.[1]
          ? this.decodeHtmlEntities(imageMatch[1])
          : '',
        companyName: siteNameMatch?.[1] ?? '',
      };
    } catch {
      return { thumbnailUrl: '', companyName: '' };
    }
  }

  async fetchArticleText(link: string): Promise<string> {
    try {
      const res = await fetch(link, {
        headers: { 'User-Agent': 'Mozilla/5.0' }, // 이미 쓰던 헤더 통일
      });
      const html = await res.text();
      const $ = cheerio.load(html);

      $('script, style, nav, footer, header, aside').remove();

      const articleText = $('article, .article-body, #articleBody, main')
        .text()
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 3000);

      return articleText;
    } catch {
      console.log('크롤링 실패');
      return ''; // 크롤링 실패 시 빈 문자열 반환
    }
  }

  private decodeHtmlEntities(text: string): string {
    return text
      .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) =>
        String.fromCharCode(parseInt(hex, 16)),
      )
      .replace(/&#(\d+);/g, (_, dec: string) =>
        String.fromCharCode(parseInt(dec, 10)),
      )
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");
  }

  private async categorizeNews(
    title: string,
    description: string,
  ): Promise<Category> {
    try {
      const apiKey = this.configService.get<string>('GROQ_API_KEY') ?? '';
      const response = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            max_tokens: 20,
            messages: [
              {
                role: 'system',
                content: `당신은 뉴스 카테고리 분류기입니다. 반드시 아래 기준에 따라 카테고리 이름 하나만 반환하세요. 다른 텍스트는 절대 포함하지 마세요.
 
[카테고리 분류 기준]
- POLITICS: 국회, 정당, 선거, 대통령, 장관, 외교, 법안, 정책 결정 등 정치 권력과 관련된 내용
- ECONOMY: 주식, 환율, 금리, 기업 실적, 산업, 무역, 부동산 시장, 경제 지표, 고용/취업 등 경제 활동과 관련된 내용. 물가·소비·서민 경제도 ECONOMY에 해당
- SOCIETY: 사건·사고, 범죄, 재난, 교육, 노동, 복지, 환경, 인구, 의료·보건(정책 제외) 등 사회 현상과 관련된 내용
- LIFE: 음식, 여행, 패션, 건강·웰빙, 육아, 문화, 예술, 공연, 스포츠, 종교 등 일상생활과 관련된 내용
- IT_SCIENCE: IT 기술, AI, 소프트웨어, 하드웨어, 우주, 과학 연구, 스타트업, 앱·플랫폼 등과 관련된 내용
- WORLD: 해외 국가의 정치·경제·사회·사건 등 국제 뉴스. 한국이 주체가 아닌 해외 이슈
 
[경계 기준]
- 물가·소비·서민경제 → ECONOMY (SOCIETY 아님)
- 국내 정치인의 경제 정책 발언 → POLITICS
- 해외 경제 이슈 → WORLD
- 의료 기술 개발 → IT_SCIENCE / 의료 정책·보건 → SOCIETY`,
              },
              {
                role: 'user',
                content: `다음 뉴스를 분류해주세요.
제목: ${title}
내용: ${description}
카테고리 이름만 반환하세요.`,
              },
            ],
          }),
        },
      );

      const data = (await response.json()) as {
        choices: { message: { content: string } }[];
      };

      const categoryText = data.choices[0]?.message?.content
        ?.trim()
        .toUpperCase();
      return (
        Category[categoryText as keyof typeof Category] ?? Category.SOCIETY
      );
    } catch {
      return Category.SOCIETY;
    }
  }
}
