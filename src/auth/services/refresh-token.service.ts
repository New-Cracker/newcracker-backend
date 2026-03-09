import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';
import { Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import bcrypt from 'node_modules/bcryptjs';

@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async save(user: User, refreshToken: string) {
    const hashed = await bcrypt.hash(refreshToken, 10);

    let existingRefreshToken = await this.refreshTokenRepository.findOne({
      where: { user: { id: user.id } },
      relations: ['user'],
    });

    if (!existingRefreshToken) {
      existingRefreshToken = this.refreshTokenRepository.create({
        token: hashed,
        user,
      });
    } else {
      existingRefreshToken.token = hashed;
    }

    await this.refreshTokenRepository.save(existingRefreshToken);
  }

  async validateRefreshToken(
    userId: number,
    refreshToken: string,
  ): Promise<User> {
    const storedToken = await this.refreshTokenRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    if (!storedToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const isMatch = await bcrypt.compare(refreshToken, storedToken.token);

    if (!isMatch) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return storedToken.user;
  }
}
