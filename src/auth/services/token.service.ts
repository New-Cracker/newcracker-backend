import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/user/entities/user.entity';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  async generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '5m',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: '1h',
    });

    return { accessToken, refreshToken };
  }

  async verifyAccessToken(token: string) {
    //반환 타입 지정 -> JwtPayload
    return this.jwtService.verifyAsync<JwtPayload>(token, {
      ignoreExpiration: true,
    });
  }
}
