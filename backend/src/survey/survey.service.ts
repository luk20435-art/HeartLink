import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SurveyResponse } from './survey-response.entity';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { User } from '../users/user.entity';

@Injectable()
export class SurveyService {
  constructor(
    @InjectRepository(SurveyResponse)
    private readonly repo: Repository<SurveyResponse>,
  ) {}

  create(dto: CreateSurveyDto, user: User) {
    const response = this.repo.create({ ...dto, userId: user.id });
    return this.repo.save(response);
  }

  findMine(user: User) {
    return this.repo.find({ where: { userId: user.id }, order: { createdAt: 'DESC' } });
  }

  async findAll() {
    const responses = await this.repo.find({
      relations: { user: true },
      order: { createdAt: 'DESC' },
    });
    return responses.map((r) => ({
      id: r.id,
      q1: r.q1,
      q2: r.q2,
      q3: r.q3,
      q4: r.q4,
      q5: r.q5,
      q6: r.q6,
      q7: r.q7,
      q8: r.q8,
      q9: r.q9,
      q10: r.q10,
      q11: r.q11,
      q12: r.q12,
      q13: r.q13,
      q14: r.q14,
      q15: r.q15,
      q16: r.q16,
      q17: r.q17,
      q18: r.q18,
      q19: r.q19,
      q20: r.q20,
      comment: r.comment,
      createdAt: r.createdAt,
      respondent: {
        fullName: r.user.fullName,
        role: r.user.role,
      },
    }));
  }
}
