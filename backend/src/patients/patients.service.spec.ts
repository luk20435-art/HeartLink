import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { Patient } from './patient.entity';
import { HealthRecord } from '../health-records/health-record.entity';
import { User } from '../users/user.entity';
import { UserRole } from '../users/user-role.enum';
import { PatientStatus } from './patient-status.enum';

type MockRepo<T extends object = any> = {
  [K in keyof jest.Mocked<import('typeorm').Repository<T>>]?: jest.Mock;
};

function chainable(finalResult: unknown) {
  const qb: any = {};
  const chainMethods = ['select', 'addSelect', 'where', 'andWhere', 'groupBy', 'orderBy'];
  for (const m of chainMethods) qb[m] = jest.fn().mockReturnValue(qb);
  qb.getMany = jest.fn().mockResolvedValue(finalResult);
  qb.getRawMany = jest.fn().mockResolvedValue(finalResult);
  return qb;
}

describe('PatientsService', () => {
  let service: PatientsService;
  let patientRepo: MockRepo<Patient>;
  let recordRepo: MockRepo<HealthRecord>;
  let userRepo: MockRepo<User>;

  const volunteer: User = { id: 'vol-1', role: UserRole.VOLUNTEER } as User;
  const otherVolunteer: User = { id: 'vol-2', role: UserRole.VOLUNTEER } as User;
  const staff: User = { id: 'staff-1', role: UserRole.STAFF } as User;

  beforeEach(async () => {
    patientRepo = {
      findOneBy: jest.fn(),
      count: jest.fn(),
      create: jest.fn((x) => x),
      save: jest.fn((x) => Promise.resolve(x)),
      createQueryBuilder: jest.fn(),
    };
    recordRepo = {
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    userRepo = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientsService,
        { provide: getRepositoryToken(Patient), useValue: patientRepo },
        { provide: getRepositoryToken(HealthRecord), useValue: recordRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
      ],
    }).compile();

    service = module.get(PatientsService);
  });

  describe('getEntity', () => {
    it('throws NotFoundException when the patient does not exist', async () => {
      patientRepo.findOneBy!.mockResolvedValue(null);
      await expect(service.getEntity('missing-id', volunteer)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when a volunteer requests a patient they do not own', async () => {
      patientRepo.findOneBy!.mockResolvedValue({
        id: 'p1',
        volunteerId: otherVolunteer.id,
      } as Patient);
      await expect(service.getEntity('p1', volunteer)).rejects.toThrow(ForbiddenException);
    });

    it('returns the patient when a volunteer requests their own patient', async () => {
      const patient = { id: 'p1', volunteerId: volunteer.id } as Patient;
      patientRepo.findOneBy!.mockResolvedValue(patient);
      await expect(service.getEntity('p1', volunteer)).resolves.toBe(patient);
    });

    it('returns any patient for staff regardless of owning volunteer', async () => {
      const patient = { id: 'p1', volunteerId: otherVolunteer.id } as Patient;
      patientRepo.findOneBy!.mockResolvedValue(patient);
      await expect(service.getEntity('p1', staff)).resolves.toBe(patient);
    });
  });

  describe('create', () => {
    it('generates a sequential CVD code based on the current patient count', async () => {
      patientRepo.count!.mockResolvedValue(2);
      const dto = { fullName: 'Test', age: 40, sex: 'male' } as any;
      await service.create(dto, volunteer);
      expect(patientRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'CVD003', volunteerId: volunteer.id }),
      );
    });
  });

  describe('findAllForUser status derivation', () => {
    const makePatients = (ids: string[]) =>
      ids.map((id) => ({ id, createdAt: new Date(), volunteerId: volunteer.id }) as Patient);

    function setup(maxVisitRows: { patientId: string; maxVisit: string }[], riskRows: any[] = []) {
      const patients = makePatients(maxVisitRows.map((r) => r.patientId).concat('no-visits'));
      patientRepo.createQueryBuilder!.mockReturnValue(chainable(patients));
      recordRepo.createQueryBuilder!.mockReturnValue(chainable(maxVisitRows));
      recordRepo.find!.mockResolvedValue(riskRows);
      return patients;
    }

    it('marks a patient with no visits as not_screened', async () => {
      setup([]);
      const result = await service.findAllForUser(volunteer);
      const noVisits = result.find((p) => p.id === 'no-visits')!;
      expect(noVisits.status).toBe(PatientStatus.NOT_SCREENED);
      expect(noVisits.riskLevel).toBeNull();
    });

    it('marks a patient with only visit 1 as screened', async () => {
      setup([{ patientId: 'p1', maxVisit: '1' }]);
      const result = await service.findAllForUser(volunteer);
      expect(result.find((p) => p.id === 'p1')!.status).toBe(PatientStatus.SCREENED);
    });

    it.each([['2'], ['3']])('marks a patient with max visit %s as tracking', async (maxVisit) => {
      setup([{ patientId: 'p1', maxVisit }]);
      const result = await service.findAllForUser(volunteer);
      expect(result.find((p) => p.id === 'p1')!.status).toBe(PatientStatus.TRACKING);
    });

    it('marks a patient with visit 4 as completed', async () => {
      setup([{ patientId: 'p1', maxVisit: '4' }]);
      const result = await service.findAllForUser(volunteer);
      expect(result.find((p) => p.id === 'p1')!.status).toBe(PatientStatus.COMPLETED);
    });

    it('attaches the highest-visit-number non-null risk level per patient', async () => {
      setup(
        [{ patientId: 'p1', maxVisit: '2' }],
        [
          { patientId: 'p1', visitNumber: 1, cvdRiskLevel: 'high' },
          { patientId: 'p1', visitNumber: 2, cvdRiskLevel: 'low' },
        ],
      );
      const result = await service.findAllForUser(volunteer);
      // rows are processed in ASC visitNumber order, so the later visit's level wins
      expect(result.find((p) => p.id === 'p1')!.riskLevel).toBe('low');
    });
  });
});
