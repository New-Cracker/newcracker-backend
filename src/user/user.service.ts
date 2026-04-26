import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import bcrypt from 'node_modules/bcryptjs';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateUserRequestDto } from './dto/update-user-request.dto';
import { UpdateUserResponseDto } from './dto/update-user-response.dto';
import { Category } from 'src/news/entities/enum/category.enum';
import { UpdatePasswordRequestDto } from './dto/update-password-request.dto';
import { UserDetailResponseDto } from './dto/user-detail-response.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async create(
    email: string,
    hashedPassword: string,
    username: string | null,
    category: Category | null,
  ): Promise<User> {
    if (!email && !hashedPassword) {
      throw new UnauthorizedException('회원가입을 진행할 수 없습니다.');
    }

    if (!username) {
      username = 'New Cracker User';
    }

    const user = this.userRepository.create({
      email: email,
      password: hashedPassword,
      username: username ?? 'New Cracker User',
      category: category ?? undefined,
    });

    return await this.userRepository.save(user);
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 올바르지 않습니다.',
      );
    }

    return user;
  }

  async findExistingUser(email: string) {
    const existingUser = await this.userRepository.findOne({
      where: { email: email },
    });

    if (existingUser) {
      throw new ConflictException('이미 존재하는 이메일입니다.');
    }
  }

  // findAll() {
  //   return `This action retsdfsdfurns all user`;
  // }

  async findById(id: number): Promise<User> {
    const user = await this.userRepository.findOneBy({ id: id });

    if (!user) {
      throw new NotFoundException('존재하지 않는 유저입니다.');
    }

    return user;
  }

  async userDetail(id: number): Promise<UserDetailResponseDto> {
    const user = await this.findById(id);

    return {
      userId: user.id,
      email: user.email,
      category: user.category,
      username: user.username,
      createdAt: user.createdAt,
    };
  }

  async update(
    id: number,
    updateUserDto: UpdateUserRequestDto,
  ): Promise<UpdateUserResponseDto> {
    const user = await this.findById(id);

    Object.assign(user, updateUserDto);

    const updatedUser = await this.userRepository.save(user);
    return UpdateUserResponseDto.from(updatedUser);
  }

  async updatePassword(
    id: number,
    dto: UpdatePasswordRequestDto,
  ): Promise<string> {
    const user = await this.findById(id);

    const isPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      console.log(dto.currentPassword, user.password);
      throw new UnauthorizedException('현재 비밀번호가 올바르지 않습니다.');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(dto.newPassword, saltRounds);

    await this.userRepository.update(id, { password: hashedPassword });

    return '비밀번호가 성공적으로 변경되었습니다.';
  }
}
