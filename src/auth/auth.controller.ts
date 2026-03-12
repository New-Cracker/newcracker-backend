import { Controller, Post, Body, Headers } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { LoginRequestDto } from './dto/login-request.dto';
import { RefreshRequestDto } from './dto/refresh-request.dto';
import { SignupRequestDto } from 'src/user/dto/signup-request.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/signup')
  signup(@Body() createUserDto: SignupRequestDto) {
    return this.authService.signup(createUserDto);
  }

  @Post('login')
  login(@Body() request: LoginRequestDto) {
    return this.authService.login(request);
  }

  @Post('refresh')
  refresh(
    @Headers('authorization') authorization: string,
    @Body() refreshToken: RefreshRequestDto,
  ) {
    const accessToken = authorization.replace('Bearer ', '');
    return this.authService.refresh(accessToken, refreshToken);
  }
}
