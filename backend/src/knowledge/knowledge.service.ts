import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KnowledgeItem } from './knowledge-item.entity';
import { KnowledgeType } from './knowledge-type.enum';
import { CreateKnowledgeDto } from './dto/create-knowledge.dto';
import { User } from '../users/user.entity';

@Injectable()
export class KnowledgeService {
  constructor(
    @InjectRepository(KnowledgeItem)
    private readonly repo: Repository<KnowledgeItem>,
  ) {}

  findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  create(dto: CreateKnowledgeDto, imageUrl: string | null, user: User) {
    if (dto.type === KnowledgeType.VIDEO && !dto.videoUrl) {
      throw new BadRequestException('กรุณาระบุลิงก์วิดีโอ');
    }
    if (dto.type === KnowledgeType.POSTER && !imageUrl) {
      throw new BadRequestException('กรุณาอัปโหลดรูปโปสเตอร์');
    }
    const item = this.repo.create({
      title: dto.title,
      type: dto.type,
      description: dto.description ?? null,
      videoUrl: dto.type === KnowledgeType.VIDEO ? (dto.videoUrl ?? null) : null,
      imageUrl: dto.type === KnowledgeType.POSTER ? imageUrl : null,
      createdById: user.id,
    });
    return this.repo.save(item);
  }

  async remove(id: string) {
    const item = await this.repo.findOneBy({ id });
    if (!item) {
      throw new NotFoundException('ไม่พบเนื้อหา');
    }
    await this.repo.remove(item);
    return { deleted: true };
  }
}
