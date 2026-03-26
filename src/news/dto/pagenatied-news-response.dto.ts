import { NewsResponseDto } from './news-response.dto';

export class PaginatedNewsResponseDto {
  items: NewsResponseDto[];
  totalItems: number; // 전체 아이템 수
  totalPages: number; // 전체 페이지 수
  currentPage: number; // 현재 페이지
  itemsPerPage: number; // 페이지당 아이템 수

  static of(
    items: NewsResponseDto[],
    totalItems: number,
    currentPage: number,
    itemsPerPage: number,
  ): PaginatedNewsResponseDto {
    const dto = new PaginatedNewsResponseDto();
    dto.items = items;
    dto.totalItems = totalItems;
    dto.totalPages = Math.ceil(totalItems / itemsPerPage);
    dto.currentPage = currentPage;
    dto.itemsPerPage = itemsPerPage;
    return dto;
  }
}
