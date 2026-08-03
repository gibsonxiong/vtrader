import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ValidationPipe, Logger } from '@nestjs/common';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';
import { AllExceptionsFilter, LoggingInterceptor } from './common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'warn', 'error'],
  });

  // 全局异常过滤器 — 统一 { code, msg, data } 格式
  app.useGlobalFilters(new AllExceptionsFilter());

  // 全局请求日志拦截器
  app.useGlobalInterceptors(new LoggingInterceptor());

  // 全局参数校验管道
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.use(cookieParser());

  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('VTrader example')
    .setDescription('The VTrader API description')
    .setVersion('1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  app.useWebSocketAdapter(new IoAdapter(app));

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application is running on: http://localhost:${process.env.PORT ?? 3000}`);
}

bootstrap().catch((err) => {
  console.error('Bootstrap failed:', err.message);
});

// 进程级兜底：未捕获异常记录日志后优雅退出
process.on('uncaughtException', (err) => {
  Logger.error(`[uncaughtException] ${err.message}`, err.stack);
  setTimeout(() => process.exit(1), 1000);
});
process.on('unhandledRejection', (reason: any) => {
  Logger.error(`[unhandledRejection] ${reason?.message ?? reason}`, reason?.stack);
});
