import { DocumentBuilder, SwaggerCustomOptions } from '@nestjs/swagger';

export class SwaggerConfig {
  private readonly doc: DocumentBuilder = new DocumentBuilder();

  public initializeOptions() {
    return this.doc
      .setTitle('New Cracker - 개인화 뉴스 요약·트렌드 분석 서비스') // 문서 제목
      .setDescription('뉴 크래커 백엔드 API') // 문서 설명
      .setVersion('1.0') // 문서 버전
      .setContact('나혜', '', 'knahye311@gmail.com')
      .addBearerAuth(
        // 이 부분 추가
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          in: 'header',
        },
        'access-token',
      )
      .build();
  }

  public getCustomOptions(): SwaggerCustomOptions {
    return {
      swaggerOptions: {
        persistAuthorization: true, // 페이지 새로고침 후에도 JWT 유지
      },
    };
  }
}
