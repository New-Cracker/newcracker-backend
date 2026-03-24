import { Controller, Post, Body, Headers } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { LoginRequestDto } from './dto/login-request.dto';
import { RefreshRequestDto } from './dto/refresh-request.dto';
import { SignupRequestDto } from 'src/auth/dto/signup-request.dto';
import { ApiDocs } from 'src/common/decorators/swagger.decorator';
import { AuthResponseDto } from './dto/auth-response.dto';
import { RefreshResponseDto } from './dto/refresh-response.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/signup')
  @ApiDocs({
    summary: '회원가입',
    description:
      '사용자 정보로 회원가입 시 인증 토큰들과 사용자 이름, 지정 카테고리를 반환합니다.',
    successType: AuthResponseDto,
    isNotFound: true,
  })
  signup(@Body() createUserDto: SignupRequestDto): Promise<AuthResponseDto> {
    return this.authService.signup(createUserDto);
  }

  @Post('login')
  @ApiDocs({
    summary: '로그인',
    description:
      '이메일로 로그인 시 인증 토큰들과 사용자 이름, 지정 카테고리를 반환합니다.',
    successType: AuthResponseDto,
    isNotFound: true,
  })
  login(@Body() request: LoginRequestDto): Promise<AuthResponseDto> {
    return this.authService.login(request);
  }

  @Post('refresh')
  @ApiDocs({
    summary: '토큰 재발급',
    description: '새로 생성된 AT, RT를 반환합니다.',
    successType: RefreshResponseDto,
    isNotFound: true,
  })
  refresh(
    @Headers('authorization') authorization: string,
    @Body() refreshToken: RefreshRequestDto,
  ): Promise<RefreshResponseDto> {
    const accessToken = authorization.replace('Bearer ', '');
    return this.authService.refresh(accessToken, refreshToken);
  }
}
