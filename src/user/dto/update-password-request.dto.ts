import { IsNotEmpty, IsString } from 'class-validator';

export class UpdatePasswordRequestDto {
  @IsString()
  @IsNotEmpty({ message: '현재 비밀번호를 불러올 수 없습니다.' })
  currentPassword!: string;

  @IsString()
  @IsNotEmpty({ message: '새 비밀번호를 입력해주세요.' })
  newPassword!: string;
}
