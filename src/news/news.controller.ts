// news/news.controller.ts
import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { NewsService } from './news.service';
import { ApiBearerAuth, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { NewsResponseDto } from './dto/news-response.dto';
import { Category } from './entities/enum/category.enum';
import { PopularNewsResponseDto } from './dto/popular-news-response.dto';
import { NewsDetailResponseDto } from './dto/news-detail-response.dto';
import { NewsDetailRequestDto } from './dto/news-detail-request.dto';
import { ApiDocs } from 'src/common/decorators/swagger.decorator';
import { PaginatedNewsResponseDto } from './dto/pagenatied-news-response.dto';

@ApiTags('news')
@Controller('news')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get('latest')
  @ApiQuery({ name: 'category', required: false, enum: Category })
  @ApiDocs({
    summary: '최신 뉴스 조회',
    description:
      '카테고리 기반 최신 뉴스를 조회합니다. DB에 저장하지 않으며, 네이버 뉴스 API에서 크롤링 한 데이터를 반환합니다.',
    successType: NewsResponseDto,
    isNotFound: true,
  })
  findLatest(@Query('category') category?: string): Promise<NewsResponseDto[]> {
    return this.newsService.findLatest(category);
  }

  @Get('popular')
  @ApiDocs({
    summary: '인기 뉴스 조회',
    description:
      'DB 저장 데이터 기반 인기 뉴스 조회입니다. 조회수에 따라 결정되며 상단 배지에 배치될 데이터들 입니다.',
    successType: PopularNewsResponseDto,
    isNotFound: true,
  })
  async findPopular(): Promise<PopularNewsResponseDto[]> {
    return this.newsService.findPopular();
  }

  @Post('detail')
  @ApiDocs({
    summary: '뉴스 상제 조회(& 데이터 저장)',
    description:
      'link 기반 뉴스 상세 조회입니다. 조회 시 DB에 저장되며 조회수가 1 증가합니다.',
    successType: NewsDetailResponseDto,
    isNotFound: true,
  })
  @ApiResponse({
    status: 200,
    description: '조회 성공',
    type: NewsDetailResponseDto,
  })
  async getDetail(
    @Body() dto: NewsDetailRequestDto,
  ): Promise<NewsDetailResponseDto> {
    return this.newsService.getDetail(dto);
  }

  @Get()
  @ApiQuery({ name: 'category', required: false, enum: Category })
  @ApiDocs({
    summary: '카테고리별 뉴스 조회',
    description:
      '카테고리와 페이지 번호로 뉴스 목록을 조회합니다. 페이지당 10개, 최대 10페이지(100개)를 제공합니다.',
    successType: PaginatedNewsResponseDto,
    isAuth: false,
  })
  async findNewsByCategory(
    @Query('category') category: Category,
    @Query('page') page: number = 1,
  ): Promise<PaginatedNewsResponseDto> {
    return this.newsService.findNewsByCategory(category, Number(page));
  }
}
