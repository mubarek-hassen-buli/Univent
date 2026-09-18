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
  const allowedOrigins = new Set([
    'https://univent-red.vercel.app',
    'http://localhost:3000',
    ...(frontendUrl ? [frontendUrl.replace(/\/$/, '')] : []),
  ]);

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server, health checks)
      if (!origin) {
        callback(null, true);
        return;
      }

      if (
        allowedOrigins.has(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.includes('localhost')
      ) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Idempotency-Key', 'Origin', 'Accept'],
    exposedHeaders: ['Set-Cookie'],
  });

  // Global API Prefix (excluding root and health check)
  app.setGlobalPrefix('api', {
    exclude: ['/', 'health'],
  });

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
