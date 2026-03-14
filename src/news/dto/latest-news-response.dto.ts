// news/dto/news-list-response.dto.ts
import { News } from '../entities/news.entity';
import { Category } from '../entities/enum/category.enum';
import { NewsItem } from '../interfaces/news-item.interface';

export class LatestNewsResponseDto {
  id: number;
  title: string;
  publicationDate: Date;
  thumbnailUrl: string;
  summary: string;
  category: Category;
  viewCount: number;

  static from(news: News): LatestNewsResponseDto {
    const dto = new LatestNewsResponseDto();
    dto.id = news.id;
    dto.title = news.title;
    dto.publicationDate = news.publicationDate;
    dto.thumbnailUrl = news.thumbnailUrl;
    dto.summary = news.summary;
    dto.category = news.category;
    dto.viewCount = news.viewCount;
    return dto;
  }

  static fromNaverItem(item: NewsItem): LatestNewsResponseDto {
    const dto = new LatestNewsResponseDto();
    dto.title = item.title;
    dto.publicationDate = new Date(item.pubDate);
    dto.summary = item.description;
    dto.thumbnailUrl = item.thumbnailUrl; // 네이버 API는 썸네일 미제공
    return dto;
  }
}
