import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';

export const CurrentUser = createParamDecorator(
  (_, ctx: ExecutionContext): JwtPayload => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user: JwtPayload }>();

    if (!request) {
      throw new UnauthorizedException('로그인 해주세요.');
    }

    return request.user; // JwtStrategy에서 주입된 유저
  },
);
