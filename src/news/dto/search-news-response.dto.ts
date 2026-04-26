import { Category } from '../entities/enum/category.enum';
import { NewsItem } from '../interfaces/news-item.interface';

export class SearchNewsResponseDto {
  companyName: string;
  title: string;
  summary: string;
  thumbnailUrl: string;
  link: string;
  publicationDate: string;
  category: Category;

  static from(item: NewsItem): SearchNewsResponseDto {
    const dto = new SearchNewsResponseDto();
    dto.companyName = item.companyName;
    dto.title = item.title;
    dto.summary = item.description;
    dto.thumbnailUrl = item.thumbnailUrl;
    dto.link = item.link;
    dto.publicationDate = new Date(item.pubDate).toISOString(); // RFC 2822 → ISO 8601 변환
    return dto;
  }
}
