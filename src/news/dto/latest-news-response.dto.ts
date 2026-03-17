// news/dto/news-list-response.dto.ts
// import { News } from '../entities/news.entity';
import { Category } from '../entities/enum/category.enum';
import { NewsItem } from '../interfaces/news-item.interface';

export class LatestNewsResponseDto {
  id: number;
  title: string;
  category: Category;
  thumbnailUrl: string;
  summary: string;
  publicationDate: Date;
  companyName: string;
  link: string;

  // static from(news: News): LatestNewsResponseDto {
  //   const dto = new LatestNewsResponseDto();
  //   dto.id = news.id;
  //   dto.title = news.title;
  //   dto.publicationDate = news.publicationDate;
  //   dto.thumbnailUrl = news.thumbnailUrl;
  //   dto.summary = news.summary;
  //   dto.category = news.category;
  //   return dto;
  // }

  static fromNaverItem(item: NewsItem): LatestNewsResponseDto {
    const dto = new LatestNewsResponseDto();
    dto.title = item.title;
    dto.category = item.category;
    dto.thumbnailUrl = item.thumbnailUrl;
    dto.summary = item.description;
    dto.publicationDate = new Date(item.pubDate);
    dto.companyName = item.companyName;
    dto.link = item.link;
    return dto;
  }
}
