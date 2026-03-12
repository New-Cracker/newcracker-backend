import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class SignupRequestDto {
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  @IsNotEmpty({ message: '이메일을 입력하세요.' })
  email: string;

  @MinLength(6, { message: '비밀번호는 최소 6자 이상이어야 합니다.' })
  @IsNotEmpty({ message: '비밀번호를 입력하세요.' })
  password: string;
}
