import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { firstValueFrom } from 'rxjs';
import { Category } from './entities/enum/category.enum';
import { News } from './entities/news.entity';
import { Company } from './entities/company.entity';
import { NaverNewsItem } from './interfaces/naver-news-item.interface';
import { NaverNewsResponse } from './interfaces/naver-news-response.interface';
import { NewsService } from './news.service';
import { CompanyService } from './company.service';

// 카테고리별 검색 키워드 매핑
const CATEGORY_KEYWORDS: { category: Category; keyword: string }[] = [
  { category: Category.POLITICS, keyword: '정치' },
  { category: Category.ECONOMY, keyword: '경제' },
  { category: Category.SOCIETY, keyword: '사회' },
  { category: Category.LIFE, keyword: '생활/문화' },
  { category: Category.IT_SCIENCE, keyword: 'IT/과학' },
  { category: Category.WORLD, keyword: '세계' },
];

@Injectable()
export class NewsCrawlingService {
  // private readonly logger = new Logger(NewsCrawlingService.name);
  // constructor(
  //   private readonly httpService: HttpService,
  //   private readonly newsService: NewsService,
  //   private readonly companyService: CompanyService,
  // ) {}
  // // 매 10분마다 실행
  // @Cron(CronExpression.EVERY_10_MINUTES)
  // async crawlAllCategories() {
  //   for (const { category, keyword } of CATEGORY_KEYWORDS) {
  //     await this.crawlByCategory(category, keyword);
  //   }
  // }
  // private async crawlByCategory(category: Category, keyword: string) {
  //   try {
  //     const items = await this.fetchNaverNews(keyword);
  //     for (const item of items) {
  //       //파싱
  //       const cleanTitle = item.title.replace(/<[^>]*>/g, '');
  //       const cleanSummary = item.description.replace(/<[^>]*>/g, '');
  //       const companyName = this.extractCompanyName(item.originallink);
  //       const company = await this.companyService.findOrCreate(
  //         companyName,
  //         item.originallink,
  //       );
  //     }
  //   } catch (error) {
  //     const message =
  //       error instanceof Error ? error.message : '알 수 없는 오류';
  //     this.logger.error(`[${category}] 크롤링 실패: ${message}`);
  //   }
  // }
  // private async fetchNaverNews(keyword: string): Promise<NaverNewsItem[]> {
  //   const encodedQuery = encodeURIComponent(keyword);
  //   const response = await firstValueFrom(
  //     this.httpService.get<NaverNewsResponse>(
  //       `https://openapi.naver.com/v1/search/news?query=${encodedQuery}&display=100&sort=date`,
  //       {
  //         headers: {
  //           'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID,
  //           'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET,
  //         },
  //       },
  //     ),
  //   );
  //   return response.data.items;
  // }
  // private async saveNews(item: NaverNewsItem, category: Category) {
  //   // 중복 방지: 같은 링크 있으면 스킵
  //   const exists = await this.newsRepository.findOne({
  //     where: { link: item.originallink },
  //   });
  //   if (exists) return;
  //   // 언론사명 추출 (originallink 도메인에서 파싱)
  //   const companyName = this.extractCompanyName(item.originallink);
  //   const company = await this.findOrCreateCompany(
  //     companyName,
  //     item.originallink,
  //   );
  //   // HTML 태그 제거 (<b>, </b> 등)
  //   const cleanTitle = item.title.replace(/<[^>]*>/g, '');
  //   const cleanSummary = item.description.replace(/<[^>]*>/g, '');
  //   const news = this.newsRepository.create({
  //     title: cleanTitle,
  //     category,
  //     company,
  //     summary: cleanSummary,
  //     link: item.originallink,
  //     publicationDate: new Date(item.pubDate),
  //   });
  //   await this.newsRepository.save(news);
  // }
  // private extractCompanyName(url: string): string {
  //   try {
  //     const hostname = new URL(url).hostname; // ex) www.chosun.com
  //     return hostname.replace('www.', ''); // ex) chosun.com
  //   } catch {
  //     return '알 수 없음';
  //   }
  // }
  // private async findOrCreateCompany(
  //   name: string,
  //   url: string,
  // ): Promise<Company> {
  //   let company = await this.companyRepository.findOne({ where: { name } });
  //   if (!company) {
  //     const origin = new URL(url).origin; // ex) https://www.chosun.com
  //     company = this.companyRepository.create({ name, homepageUrl: origin });
  //     await this.companyRepository.save(company);
  //   }
  //   return company;
  // }
}
