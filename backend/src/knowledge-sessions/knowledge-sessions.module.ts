import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KnowledgeSession } from './knowledge-session.entity';
import { KnowledgeItem } from '../knowledge/knowledge-item.entity';
import { KnowledgeSessionsService } from './knowledge-sessions.service';
import { KnowledgeSessionsController } from './knowledge-sessions.controller';
import { PatientsModule } from '../patients/patients.module';

@Module({
  imports: [TypeOrmModule.forFeature([KnowledgeSession, KnowledgeItem]), PatientsModule],
  controllers: [KnowledgeSessionsController],
  providers: [KnowledgeSessionsService],
})
export class KnowledgeSessionsModule {}
