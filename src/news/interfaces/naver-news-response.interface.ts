import { NaverNewsItem } from './naver-news-item.interface';

export interface NaverNewsResponse {
  lastBuildDate: string; // 검색 결과 생성 시간
  total: number; // 총 검색 결과 수
  start: number; // 검색 시작 위치
  display: number; // 한 번에 표시된 결과 수
  items: NaverNewsItem[]; // 뉴스 목록
}
