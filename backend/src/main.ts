import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { mkdirSync } from 'fs';
import { join } from 'path';
import { AppModule } from './app.module';

// A mounted volume (e.g. a Railway volume) starts out empty, so these
// subdirectories won't exist yet on a fresh deploy — create them on boot
// rather than relying on files checked into git.
function ensureUploadDirs() {
  for (const dir of ['avatars', 'posters']) {
    mkdirSync(join(process.cwd(), 'uploads', dir), { recursive: true });
  }
}

async function bootstrap() {
  // TEMP DEBUG — remove once the Railway env var issue is confirmed fixed.
  for (const key of ['DB_HOST', 'DB_PORT', 'DB_USERNAME', 'DB_PASSWORD', 'DB_DATABASE', 'JWT_SECRET', 'JWT_EXPIRES_IN', 'PORT']) {
    const val = process.env[key];
    console.log(`[ENV DEBUG] ${key}: present=${val !== undefined} length=${val?.length ?? 0}`);
  }

  ensureUploadDirs();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
