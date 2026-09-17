import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor.js';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = process.env.PORT
    ? parseInt(process.env.PORT, 10)
    : (configService.get<number>('PORT') ?? 5000);
  const frontendUrl = configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';

  // Security Headers
  app.use(helmet());

  // Cookie Parsing for refresh tokens
  app.use(cookieParser());

  // CORS setup
  const allowedOrigins = Array.from(
    new Set([
      frontendUrl,
      frontendUrl.replace(/\/$/, ''),
      'http://localhost:3000',
    ])
  ).filter(Boolean);

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Idempotency-Key'],
  });

  // Global API Prefix
  app.setGlobalPrefix('api');

  // Global Interceptors and Filters
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  // Graceful shutdown
  app.enableShutdownHooks();

  // Listen on 0.0.0.0 for containerized / cloud hosting (Render, Railway, Fly)
  await app.listen(port, '0.0.0.0');
  logger.log(`Univent Backend API is running on port ${port} (0.0.0.0)`);
}

bootstrap().catch((err: unknown) => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to start Univent server', err instanceof Error ? err.stack : String(err));
  process.exit(1);
});
