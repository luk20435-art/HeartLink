import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/user.entity';
import { UserRole } from '../users/user-role.enum';
import { KnowledgeService } from './knowledge.service';
import { CreateKnowledgeDto } from './dto/create-knowledge.dto';

const POSTER_DIR = './uploads/posters';
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly service: KnowledgeService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @Roles(UserRole.STAFF)
  @UseInterceptors(
    FileInterceptor('poster', {
      storage: diskStorage({
        destination: POSTER_DIR,
        filename: (_req, file, cb) => {
          cb(null, `${randomUUID()}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIME.has(file.mimetype)) {
          cb(new BadRequestException('อนุญาตเฉพาะไฟล์รูปภาพ (jpg, png, webp)'), false);
          return;
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  create(
    @Body() dto: CreateKnowledgeDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: User,
  ) {
    const imageUrl = file ? `/uploads/posters/${file.filename}` : null;
    return this.service.create(dto, imageUrl, user);
  }

  @Delete(':id')
  @Roles(UserRole.STAFF)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
