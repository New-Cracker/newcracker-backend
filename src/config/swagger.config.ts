import { DocumentBuilder } from '@nestjs/swagger';

export class SwaggerCofig {
  private readonly doc: DocumentBuilder = new DocumentBuilder();

  public initializeOptions() {
    return this.doc
      .setTitle('New Cracker - 개인화 뉴스 요약·트렌드 분석 서비스') // 문서 제목
      .setDescription('뉴 크래커 백엔드 API') // 문서 설명
      .setVersion('1.0') // 문서 버전
      .setContact('나혜', '', 'knahye311@gmail.com')
      .build();
  }
}
