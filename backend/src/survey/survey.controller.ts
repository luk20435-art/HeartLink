import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/user.entity';
import { UserRole } from '../users/user-role.enum';
import { SurveyService } from './survey.service';
import { CreateSurveyDto } from './dto/create-survey.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('survey')
export class SurveyController {
  constructor(private readonly service: SurveyService) {}

  @Post()
  create(@Body() dto: CreateSurveyDto, @CurrentUser() user: User) {
    return this.service.create(dto, user);
  }

  @Get('mine')
  findMine(@CurrentUser() user: User) {
    return this.service.findMine(user);
  }

  @Get()
  @Roles(UserRole.STAFF)
  findAll() {
    return this.service.findAll();
  }
}
