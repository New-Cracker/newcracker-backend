import { News } from '../entities/news.entity';

export class PopularNewsResponseDto {
  newsId: number;
  thumbnail: string;
  title: string;

  static from(news: News): PopularNewsResponseDto {
    const dto = new PopularNewsResponseDto();
    dto.newsId = news.id;
    dto.thumbnail = news.thumbnailUrl;
    dto.title = news.title;
    return dto;
  }
}
