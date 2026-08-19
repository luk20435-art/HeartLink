import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/user.entity';
import { KnowledgeSessionsService } from './knowledge-sessions.service';
import { CreateKnowledgeSessionDto } from './dto/create-knowledge-session.dto';

@UseGuards(JwtAuthGuard)
@Controller('patients/:patientId/knowledge-sessions')
export class KnowledgeSessionsController {
  constructor(private readonly service: KnowledgeSessionsService) {}

  @Get()
  findAll(@Param('patientId') patientId: string, @CurrentUser() user: User) {
    return this.service.findAllForPatient(patientId, user);
  }

  @Post()
  create(
    @Param('patientId') patientId: string,
    @Body() dto: CreateKnowledgeSessionDto,
    @CurrentUser() user: User,
  ) {
    return this.service.create(patientId, dto, user);
  }
}
