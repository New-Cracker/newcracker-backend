import {
  Controller,
  // Get,
  // Post,
  Body,
  Patch,
  UseGuards,
  // Patch,
  // Param,
  // Delete,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UpdateUserRequestDto } from './dto/update-user-request.dto';
import type { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiDocs } from 'src/common/decorators/swagger.decorator';
import { UpdateUserResponseDto } from './dto/update-user-response.dto';
import { UpdatePasswordRequestDto } from './dto/update-password-request.dto';

@Controller('user')
@ApiTags('user')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Patch('/me')
  @UseGuards(JwtAuthGuard)
  @ApiDocs({
    summary: '사용자 정보 업데이트',
    description: '사용자 정보를 수정합니다.',
    successType: UpdateUserResponseDto,
    isNotFound: true,
  })
  update(
    @CurrentUser() user: JwtPayload,
    @Body() updateUserDto: UpdateUserRequestDto,
  ): Promise<UpdateUserResponseDto> {
    return this.userService.update(Number(user.sub), updateUserDto);
  }

  @Patch('/me/password')
  @UseGuards(JwtAuthGuard)
  @ApiDocs({
    summary: '사용자 비밀번호 업데이트',
    description: '사용자 비밀번호를 수정합니다.',
    successType: UpdateUserResponseDto,
    isNotFound: true,
  })
  updatePassword(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdatePasswordRequestDto,
  ): Promise<string> {
    console.log(user.sub);
    return this.userService.updatePassword(Number(user.sub), dto);
  }
}
