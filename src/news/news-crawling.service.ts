// news/news-crawling.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { NewsItem } from './interfaces/news-item.interface';
import { NewsResponse } from './interfaces/news-response.interface';
import { Category } from './entities/enum/category.enum';

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

  async fetchLatestNews(): Promise<NewsItem[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<NewsResponse>(
          'https://openapi.naver.com/v1/search/news.json',
          {
            params: {
              query: '뉴스', // 전체 최신 뉴스
              display: 10,
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
          return { ...item, thumbnailUrl, companyName, category };
        }),
      );

      return newsItems;
    } catch {
      throw new InternalServerErrorException(
        '네이버 뉴스 API 호출에 실패했습니다.',
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

  async categorizeNews(title: string, description: string): Promise<Category> {
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
                content:
                  '당신은 뉴스 카테고리 분류기입니다. 반드시 주어진 카테고리 중 하나만 반환하세요. 다른 텍스트는 절대 포함하지 마세요.',
              },
              {
                role: 'user',
                content: `다음 뉴스를 카테고리 중 하나로 분류해주세요.
카테고리: POLITICS, ECONOMY, SOCIETY, LIFE, IT_SCIENCE, WORLD
카테고리 설명: POLITICS - 정치, ECONOMY - 경제, SOCIETY - 사회, LIFE - 생활/문화, IT_SCIENCE - IT/과학, WORLD - 세계
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
