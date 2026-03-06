import { Injectable } from '@nestjs/common';
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

  async remove(userId: number) {
    await this.refreshTokenRepository.delete({ user: { id: userId } });
  }
}
