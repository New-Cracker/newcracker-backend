// news/news.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { NewsService } from './news.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { SaveNewsRequestDto } from './dto/save-news-request.dto';

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

  @Get()
  findLatest() {
    return this.newsService.findLatest();
  }

  @Post()
  save(@Body() dto: SaveNewsRequestDto) {
    return this.newsService.save(dto);
  }
}
