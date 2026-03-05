import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginRequestDto } from './dto/login-request.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { RefreshToken } from './entities/refresh-token.entity';
import bcrypt from 'node_modules/bcryptjs';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,

    private readonly jwtService: JwtService,
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

    const payload = { sub: user.id, email: user.email };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '5m',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: '1h',
    });

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    // 기존 토큰 있는지 확인
    let refreshTokenEntity = await this.refreshTokenRepository.findOne({
      where: { user: { id: user.id } },
      relations: ['user'],
    });

    if (!refreshTokenEntity) {
      refreshTokenEntity = this.refreshTokenRepository.create({
        token: hashedRefreshToken,
        user,
      });
    } else {
      refreshTokenEntity.token = hashedRefreshToken;
    }

    await this.refreshTokenRepository.save(refreshTokenEntity);

    return {
      accessToken,
      refreshToken,
    };
  }
}
