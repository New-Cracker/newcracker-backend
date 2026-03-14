// news/dto/news-response.dto.ts
import { Company } from '../entities/company.entity';
import { News } from '../entities/news.entity';
import { Category } from '../entities/enum/category.enum';

export class NewsResponseDto {
  id: number;
  title: string;
  publicationDate: Date;
  thumbnailUrl: string;
  summary: string;
  aiSummary: string;
  link: string;
  similarLinks: string[];
  category: Category;
  language: string;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
  company: Company;

  static from(news: News): NewsResponseDto {
    const dto = new NewsResponseDto();
    dto.id = news.id;
    dto.title = news.title;
    dto.publicationDate = news.publicationDate;
    dto.thumbnailUrl = news.thumbnailUrl;
    dto.summary = news.summary;
    dto.aiSummary = news.aiSummary;
    dto.link = news.link;
    dto.similarLinks = news.similarLinks;
    dto.category = news.category;
    dto.language = news.language;
    dto.viewCount = news.viewCount;
    dto.createdAt = news.createdAt;
    dto.updatedAt = news.updatedAt;
    dto.company = news.company;
    return dto;
  }
}
