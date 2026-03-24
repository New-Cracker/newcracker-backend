// news/news.controller.ts
import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { NewsService } from './news.service';
import { ApiBearerAuth, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { LatestNewsResponseDto } from './dto/latest-news-response.dto';
import { Category } from './entities/enum/category.enum';
import { PopularNewsResponseDto } from './dto/popular-news-response.dto';
import { NewsResponseDto } from './dto/news-response.dto';
import { GetNewsDetailRequestDto } from './dto/get-news-detail-request.dto';
import { ApiDocs } from 'src/common/decorators/swagger.decorator';

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
    successType: LatestNewsResponseDto,
    isNotFound: true,
  })
  findLatest(
    @Query('category') category?: string,
  ): Promise<LatestNewsResponseDto[]> {
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
    successType: NewsResponseDto,
    isNotFound: true,
  })
  @ApiResponse({ status: 200, description: '조회 성공', type: NewsResponseDto })
  async getDetail(
    @Body() dto: GetNewsDetailRequestDto,
  ): Promise<NewsResponseDto> {
    return this.newsService.getDetail(dto);
  }
}
