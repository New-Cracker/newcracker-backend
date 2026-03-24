import { applyDecorators, HttpStatus, Type } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';

interface ApiDocsOptions {
  summary: string;
  description?: string;
  successStatus?: HttpStatus;
  successDescription?: string;
  successType?: Type<unknown>;
  isAuth?: boolean; // JWT 인증 필요 여부 (기본값: true)
  isNotFound?: boolean; // 404 응답 포함 여부
}

/**
 * Swagger 문서화 공통 데코레이터
 *
 * @example
 * @ApiDocs({
 *   summary: '뉴스 상세 조회',
 *   description: 'link로 뉴스를 조회합니다.',
 *   successType: NewsResponseDto,
 *   isNotFound: true,
 * })
 */
export const ApiDocs = (options: ApiDocsOptions) => {
  const {
    summary,
    description,
    successStatus = HttpStatus.OK,
    successDescription = '요청 성공',
    successType,
    isAuth = true,
    isNotFound = false,
  } = options;

  const decorators = [
    ApiOperation({ summary, description }),
    ApiResponse({
      status: successStatus,
      description: successDescription,
      type: successType,
    }),
    ApiBadRequestResponse({ description: '잘못된 요청 값' }),
    ApiInternalServerErrorResponse({ description: '서버 내부 오류' }),
  ];

  if (isAuth) {
    decorators.push(
      ApiBearerAuth('access-token'),
      ApiUnauthorizedResponse({
        description: '인증 실패 (JWT 토큰 없음 또는 만료)',
      }),
    );
  }

  if (isNotFound) {
    decorators.push(
      ApiNotFoundResponse({ description: '리소스를 찾을 수 없음' }),
    );
  }

  return applyDecorators(...decorators);
};

/** 생성 성공(201) 응답이 기본인 API용 단축 데코레이터 */
export const ApiCreateDocs = (options: Omit<ApiDocsOptions, 'successStatus'>) =>
  ApiDocs({
    ...options,
    successStatus: HttpStatus.CREATED,
    successDescription: '생성 성공',
  });
