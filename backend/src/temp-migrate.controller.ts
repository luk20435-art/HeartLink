import { BadRequestException, Controller, ForbiddenException, Headers, Post, Query, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { createWriteStream, mkdirSync } from 'fs';
import { dirname, join, normalize } from 'path';

// TEMPORARY — used once to copy existing local upload files onto the
// production volume during the initial data migration. Delete this file
// (and the MIGRATE_SECRET env var) once the migration is done.
@Controller('__migrate')
export class TempMigrateController {
  @Post()
  async upload(
    @Req() req: Request,
    @Res() res: Response,
    @Query('filename') filename: string,
    @Headers('x-migrate-secret') secret: string,
  ) {
    if (!process.env.MIGRATE_SECRET || secret !== process.env.MIGRATE_SECRET) {
      throw new ForbiddenException();
    }
    if (!filename || filename.includes('..') || normalize(filename).startsWith('..')) {
      throw new BadRequestException('bad filename');
    }
    const target = join(process.cwd(), 'uploads', filename);
    mkdirSync(dirname(target), { recursive: true });
    await new Promise<void>((resolve, reject) => {
      const ws = createWriteStream(target);
      req.pipe(ws);
      ws.on('finish', () => resolve());
      ws.on('error', reject);
    });
    res.json({ ok: true, path: target });
  }
}
