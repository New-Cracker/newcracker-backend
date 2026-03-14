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

  // async fetchNewsByKeyword(keyword: string): Promise<NewsItem[]> {
  //   try {
  //     const response = await firstValueFrom(
  //       this.httpService.get<NewsResponse>(
  //         'https://openapi.naver.com/v1/search/news.json',
  //         {
  //           params: { query: keyword, display: 10, sort: 'date' },
  //           headers: {
  //             'X-Naver-Client-Id': this.clientId,
  //             'X-Naver-Client-Secret': this.clientSecret,
  //           },
  //         },
  //       ),
  //     );

  //     // 각 뉴스 링크에서 og:image 파싱
  //     const newsItems = await Promise.all(
  //       response.data.items.map(async (item) => ({
  //         ...item,
  //         thumbnailUrl: await this.fetchThumbnail(item.link),
  //       })),
  //     );

  //     return newsItems;
  //   } catch {
  //     throw new InternalServerErrorException(
  //       '네이버 뉴스 API 호출에 실패했습니다.',
  //     );
  //   }
  // }

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

      // 각 뉴스 링크에서 og:image 파싱
      const newsItems = await Promise.all(
        response.data.items.map(async (item) => ({
          ...item,
          thumbnailUrl: await this.fetchThumbnail(item.link),
          companyName: this.extractCompanyName(item.originallink),
          category: Category.POLITICS,
        })),
      );

      return newsItems;
    } catch {
      throw new InternalServerErrorException(
        '네이버 뉴스 API 호출에 실패했습니다.',
      );
    }
  }

  private async fetchThumbnail(link: string): Promise<string> {
    try {
      console.log('요청 링크:', link);
      const response = await firstValueFrom(
        this.httpService.get<string>(link, {
          headers: {
            'User-Agent': 'Mozilla/5.0', // 봇 차단 방지
          },
          responseType: 'text',
        }),
      );

      const html = response.data;

      const match =
        /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i.exec(
          html,
        ) ??
        /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i.exec(
          html,
        );

      console.log('파싱 결과:', match?.[1]);

      return match?.[1] ? this.decodeHtmlEntities(match[1]) : '';
    } catch (error) {
      console.log('에러 링크:', link);
      console.log('에러:', error);
      return ''; // 썸네일 파싱 실패 시 빈 값 반환
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

  private extractCompanyName(originallink: string): string {
    try {
      const url = new URL(originallink);
      return url.hostname.replace('www.', '');
    } catch {
      return '';
    }
  }
}
