import { Category } from '../entities/enum/category.enum';

export interface NewsItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  thumbnailUrl: string;
  category: Category;
  companyName: string;
}

// 네이버 API 응답 (NewsResponse)
// → og:image 파싱으로 thumbnailUrl 추가
// → NewsItem 완성
// → DTO 변환 후 반환
