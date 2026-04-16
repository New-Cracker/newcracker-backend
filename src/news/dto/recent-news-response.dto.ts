import { News } from '../entities/news.entity';

export class RecentNewsResponseDto {
  companyName: string;
  title: string;
  summary: string;
  thumbnailUrl: string;

  static from(news: News): RecentNewsResponseDto {
    const dto = new RecentNewsResponseDto();
    dto.companyName = news.company?.name ?? '';
    dto.title = news.title;
    dto.summary = news.summary;
    dto.thumbnailUrl = news.thumbnailUrl;
    return dto;
  }
}
