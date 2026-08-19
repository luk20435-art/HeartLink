import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KnowledgeSession } from './knowledge-session.entity';
import { KnowledgeItem } from '../knowledge/knowledge-item.entity';
import { PatientsService } from '../patients/patients.service';
import { User } from '../users/user.entity';
import { CreateKnowledgeSessionDto } from './dto/create-knowledge-session.dto';

@Injectable()
export class KnowledgeSessionsService {
  constructor(
    @InjectRepository(KnowledgeSession)
    private readonly repo: Repository<KnowledgeSession>,
    @InjectRepository(KnowledgeItem)
    private readonly knowledgeItemRepo: Repository<KnowledgeItem>,
    private readonly patientsService: PatientsService,
  ) {}

  async findAllForPatient(patientId: string, user: User) {
    await this.patientsService.getEntity(patientId, user);
    return this.repo.find({ where: { patientId }, order: { givenDate: 'DESC', createdAt: 'DESC' } });
  }

  async create(patientId: string, dto: CreateKnowledgeSessionDto, user: User) {
    await this.patientsService.getEntity(patientId, user);

    const item = await this.knowledgeItemRepo.findOneBy({ id: dto.knowledgeItemId });
    if (!item) {
      throw new NotFoundException('ไม่พบเนื้อหาที่เลือก');
    }

    const session = this.repo.create({
      patientId,
      volunteerId: user.id,
      givenDate: dto.givenDate,
      mediaType: dto.mediaType,
      knowledgeItemId: item.id,
      itemTitleSnapshot: item.title,
      result: dto.result,
      note: dto.note ?? null,
    });
    return this.repo.save(session);
  }
}
