import { User } from '../entities/user.entity';

export class UpdateUserResponseDto {
  userId: number;

  static from(user: User): UpdateUserResponseDto {
    const dto = new UpdateUserResponseDto();
    dto.userId = user.id;
    return dto;
  }
}
