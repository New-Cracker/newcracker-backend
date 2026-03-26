import { Category } from '../entities/enum/category.enum';
import { NewsItem } from '../interfaces/news-item.interface';

export class NewsResponseDto {
  id: number;
  title: string;
  category: Category;
  thumbnailUrl: string;
  summary: string;
  publicationDate: Date;
  companyName: string;
  link: string;

  static fromNaverItem(item: NewsItem): NewsResponseDto {
    const dto = new NewsResponseDto();
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
