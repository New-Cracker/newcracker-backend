import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { SwaggerCofig } from './config/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO에 없는 값 제거
      forbidNonWhitelisted: true, // DTO에 없는 값이면 에러
      transform: true, // 타입 자동 변환
    }),
  );

  app.enableCors({
    origin: true, // 허용할 프론트엔드 주소
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true, // 쿠키/인증 헤더 허용
  });

  const apiDocumentOptions = new SwaggerCofig().initializeOptions();
  const apiDocument = SwaggerModule.createDocument(app, apiDocumentOptions);
  SwaggerModule.setup('api/v1/docs', app, apiDocument);

  await app.listen(5000);
}
bootstrap();
