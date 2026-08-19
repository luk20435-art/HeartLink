import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
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
import { User } from './user.entity';
import { UserRole } from './user-role.enum';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

const AVATAR_DIR = './uploads/avatars';
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.STAFF)
  findAll() {
    return this.usersService.findAllWithPatientCounts();
  }

  @Patch('me')
  updateProfile(@Body() dto: UpdateProfileDto, @CurrentUser() user: User) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Post('me/password')
  changePassword(@Body() dto: ChangePasswordDto, @CurrentUser() user: User) {
    return this.usersService.changePassword(user.id, dto);
  }

  @Post('me/avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: AVATAR_DIR,
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
      limits: { fileSize: 3 * 1024 * 1024 },
    }),
  )
  uploadAvatar(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: User) {
    if (!file) {
      throw new BadRequestException('ไม่พบไฟล์รูปภาพ');
    }
    return this.usersService.updateAvatar(user.id, `/uploads/avatars/${file.filename}`);
  }
}
