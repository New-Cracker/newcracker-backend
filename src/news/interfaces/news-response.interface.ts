import { NewsItem } from './news-item.interface';

export interface NewsResponse {
  items: Omit<NewsItem, 'thumbnailUrl'>[]; // NewsItem에서 thumbnailUrl을 제거한 타입
}
