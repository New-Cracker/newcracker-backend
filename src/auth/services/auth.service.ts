import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginRequestDto } from '../dto/login-request.dto';
import { TokenResponseDto } from '../dto/token-response.dto';
import bcrypt from 'node_modules/bcryptjs';
import { UserService } from 'src/user/user.service';
import { TokenService } from './token.service';
import { RefreshTokenService } from './refresh-token.service';
import { RefreshResponseDto } from '../dto/refresh-response.dto';
import { RefreshRequestDto } from '../dto/refresh-request.dto';
import { SignupRequestDto } from 'src/auth/dto/signup-request.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly refreshTokenService: RefreshTokenService,
    private readonly tokenService: TokenService,
    private readonly userService: UserService,
  ) {}

  async signup(request: SignupRequestDto): Promise<TokenResponseDto> {
    await this.userService.findExistingUser(request.email);

    const hashedPassword = await bcrypt.hash(request.password, 10);

    const user = await this.userService.create(
      request.email,
      hashedPassword,
      request.username ?? null,
      request.category ?? null,
    );

    const tokens = await this.tokenService.generateTokens(user);

    await this.refreshTokenService.save(user, tokens.refreshToken);

    return tokens;
  }

  async login(request: LoginRequestDto): Promise<TokenResponseDto> {
    const { email, password } = request;

    const user = await this.userService.findByEmail(email);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 올바르지 않습니다.',
      );
    }

    const tokens = await this.tokenService.generateTokens(user);

    await this.refreshTokenService.save(user, tokens.refreshToken);

    return tokens;
  }

  async refresh(
    accessToken: string,
    refreshRequestDto: RefreshRequestDto,
  ): Promise<RefreshResponseDto> {
    const { refreshToken } = refreshRequestDto;

    // 1 accessToken에서 userId 추출
    const payload = await this.tokenService.verifyAccessToken(accessToken);

    // 2 refreshToken 검증
    const user = await this.refreshTokenService.validateRefreshToken(
      payload.sub,
      refreshToken,
    );

    // 3 새 토큰 발급
    const tokens = await this.tokenService.generateTokens(user);

    // 4 refreshToken DB 갱신
    await this.refreshTokenService.save(user, tokens.refreshToken);

    return tokens;
  }
}
