// news/news.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NewsService } from './news.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { LatestNewsResponseDto } from './dto/latest-news-response.dto';
import { Category } from './entities/enum/category.enum';
import { PopularNewsResponseDto } from './dto/popular-news-response.dto';
import { NewsResponseDto } from './dto/news-response.dto';
import { GetNewsDetailRequestDto } from './dto/get-news-detail-request.dto';

@ApiTags('news')
@Controller('news')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get('latest')
  @ApiQuery({ name: 'category', required: false, enum: Category })
  findLatest(
    @Query('category') category?: string,
  ): Promise<LatestNewsResponseDto[]> {
    return this.newsService.findLatest(category);
  }

  @Get('popular')
  async findPopular(): Promise<PopularNewsResponseDto[]> {
    return this.newsService.findPopular();
  }

  @Post('detail')
  @ApiOperation({
    summary: '뉴스 상세 조회',
    description:
      'link로 뉴스를 조회합니다. DB에 없으면 저장 후 반환하며, 조회수를 1 증가시킵니다.',
  })
  @ApiResponse({ status: 200, description: '조회 성공', type: NewsResponseDto })
  async getDetail(
    @Body() dto: GetNewsDetailRequestDto,
  ): Promise<NewsResponseDto> {
    return this.newsService.getDetail(dto);
  }
}
