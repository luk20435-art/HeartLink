import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { KnowledgeSessionsService } from './knowledge-sessions.service';
import { KnowledgeSession } from './knowledge-session.entity';
import { KnowledgeItem } from '../knowledge/knowledge-item.entity';
import { PatientsService } from '../patients/patients.service';
import { User } from '../users/user.entity';
import { UserRole } from '../users/user-role.enum';

describe('KnowledgeSessionsService', () => {
  let service: KnowledgeSessionsService;
  let sessionRepo: { find: jest.Mock; create: jest.Mock; save: jest.Mock };
  let itemRepo: { findOneBy: jest.Mock };
  let patientsService: { getEntity: jest.Mock };

  const user: User = { id: 'vol-1', role: UserRole.VOLUNTEER } as User;

  beforeEach(async () => {
    sessionRepo = {
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn((x) => x),
      save: jest.fn((x) => Promise.resolve({ id: 'session-1', ...x })),
    };
    itemRepo = { findOneBy: jest.fn() };
    patientsService = { getEntity: jest.fn().mockResolvedValue({ id: 'p1' }) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KnowledgeSessionsService,
        { provide: getRepositoryToken(KnowledgeSession), useValue: sessionRepo },
        { provide: getRepositoryToken(KnowledgeItem), useValue: itemRepo },
        { provide: PatientsService, useValue: patientsService },
      ],
    }).compile();

    service = module.get(KnowledgeSessionsService);
  });

  describe('findAllForPatient', () => {
    it('checks patient access before returning history', async () => {
      await service.findAllForPatient('p1', user);
      expect(patientsService.getEntity).toHaveBeenCalledWith('p1', user);
    });

    it('propagates the access-check rejection instead of returning data', async () => {
      patientsService.getEntity.mockRejectedValue(new Error('forbidden'));
      await expect(service.findAllForPatient('p1', user)).rejects.toThrow('forbidden');
      expect(sessionRepo.find).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('checks patient access before creating a session', async () => {
      itemRepo.findOneBy.mockResolvedValue({ id: 'item-1', title: 'วิดีโอทดสอบ' });
      await service.create(
        'p1',
        { givenDate: '2024-01-01', mediaType: 'video', knowledgeItemId: 'item-1', result: 'given' } as any,
        user,
      );
      expect(patientsService.getEntity).toHaveBeenCalledWith('p1', user);
    });

    it('throws NotFoundException when the referenced knowledge item does not exist', async () => {
      itemRepo.findOneBy.mockResolvedValue(null);
      await expect(
        service.create(
          'p1',
          { givenDate: '2024-01-01', mediaType: 'video', knowledgeItemId: 'missing', result: 'given' } as any,
          user,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('snapshots the item title at creation time, separate from the live FK', async () => {
      itemRepo.findOneBy.mockResolvedValue({ id: 'item-1', title: 'วิดีโอประเมินความเสี่ยง' });
      await service.create(
        'p1',
        { givenDate: '2024-01-01', mediaType: 'video', knowledgeItemId: 'item-1', result: 'given' } as any,
        user,
      );
      expect(sessionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          knowledgeItemId: 'item-1',
          itemTitleSnapshot: 'วิดีโอประเมินความเสี่ยง',
          volunteerId: user.id,
        }),
      );
    });

    it('stores note as null when the result is "given" and no note was passed', async () => {
      itemRepo.findOneBy.mockResolvedValue({ id: 'item-1', title: 'Title' });
      await service.create(
        'p1',
        { givenDate: '2024-01-01', mediaType: 'poster', knowledgeItemId: 'item-1', result: 'given' } as any,
        user,
      );
      expect(sessionRepo.create).toHaveBeenCalledWith(expect.objectContaining({ note: null }));
    });

    it('stores the provided note when present', async () => {
      itemRepo.findOneBy.mockResolvedValue({ id: 'item-1', title: 'Title' });
      await service.create(
        'p1',
        {
          givenDate: '2024-01-01',
          mediaType: 'poster',
          knowledgeItemId: 'item-1',
          result: 'other',
          note: 'ผู้ป่วยไม่สะดวกคุยนาน',
        } as any,
        user,
      );
      expect(sessionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ note: 'ผู้ป่วยไม่สะดวกคุยนาน' }),
      );
    });
  });
});
