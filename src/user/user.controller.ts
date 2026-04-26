import {
  Controller,
  // Get,
  // Post,
  Body,
  Patch,
  UseGuards,
  Put,
  Get,
  Delete,
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
import { UserDetailResponseDto } from './dto/user-detail-response.dto';

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

  @Put('/me/password')
  @UseGuards(JwtAuthGuard)
  @ApiDocs({
    summary: '사용자 비밀번호 업데이트',
    description: '사용자 비밀번호를 수정합니다.',
    isNotFound: true,
  })
  updatePassword(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdatePasswordRequestDto,
  ): Promise<string> {
    return this.userService.updatePassword(Number(user.sub), dto);
  }

  @Get('/me')
  @UseGuards(JwtAuthGuard)
  @ApiDocs({
    summary: '사용자 정보 조회',
    description: '사용자 정보를 조회합니다.',
    successType: UserDetailResponseDto,
    isNotFound: true,
  })
  userDetail(@CurrentUser() user: JwtPayload): Promise<UserDetailResponseDto> {
    return this.userService.userDetail(Number(user.sub));
  }

  @Delete('/me')
  @UseGuards(JwtAuthGuard)
  @ApiDocs({
    summary: '회원 탈퇴',
    description: '회원 탈퇴입니다.',
    isNotFound: true,
  })
  deleteUser(@CurrentUser() user: JwtPayload): Promise<string> {
    return this.userService.deleteUser(Number(user.sub));
  }
}
