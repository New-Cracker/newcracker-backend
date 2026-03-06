import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginRequestDto } from '../dto/login-request.dto';
import { LoginResponseDto } from '../dto/login-response.dto';
import bcrypt from 'node_modules/bcryptjs';
import { UserService } from 'src/user/user.service';
import { TokenService } from './token.service';
import { RefreshTokenService } from './refresh-token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly refreshTokenService: RefreshTokenService,
    private readonly tokenService: TokenService,
    private readonly userService: UserService,
  ) {}

  async login(request: LoginRequestDto): Promise<LoginResponseDto> {
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
}
