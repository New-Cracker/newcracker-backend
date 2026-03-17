// news/news.controller.ts
import { Body, Controller, Get, Query, UseGuards } from '@nestjs/common';
import { NewsService } from './news.service';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { LatestNewsResponseDto } from './dto/latest-news-response.dto';
import { Category } from './entities/enum/category.enum';

@ApiTags('news')
@Controller('news')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  // @Get(':id')
  // findOne(@Param('id', ParseIntPipe) id: number) {
  //   return this.newsService.findById(id);
  // }

  @Get('latest')
  @ApiQuery({ name: 'category', required: false, enum: Category })
  findLatest(
    @Query('category') category?: string,
  ): Promise<LatestNewsResponseDto[]> {
    return this.newsService.findLatest(category);
  }
}
