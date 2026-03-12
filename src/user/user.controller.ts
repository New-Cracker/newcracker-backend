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

@Controller('user')
@ApiTags('user')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  // @Get()
  // findAll() {
  //   return this.userService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.userService.findOne(+id);
  // }

  @Patch('/me')
  @UseGuards(JwtAuthGuard)
  update(
    @CurrentUser() user: JwtPayload,
    @Body() updateUserDto: UpdateUserRequestDto,
  ) {
    return this.userService.update(user.sub, updateUserDto);
  }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.userService.remove(+id);
  // }
}
