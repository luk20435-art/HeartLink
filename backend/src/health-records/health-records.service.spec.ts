import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { HealthRecordsService } from './health-records.service';
import { HealthRecord } from './health-record.entity';
import { PatientsService } from '../patients/patients.service';
import { Patient } from '../patients/patient.entity';
import { User } from '../users/user.entity';
import { UserRole } from '../users/user-role.enum';

describe('HealthRecordsService', () => {
  let service: HealthRecordsService;
  let repo: { findOneBy: jest.Mock; create: jest.Mock; save: jest.Mock; find: jest.Mock };
  let patientsService: { getEntity: jest.Mock };

  const user: User = { id: 'vol-1', role: UserRole.VOLUNTEER } as User;
  const patient: Patient = {
    id: 'p1',
    age: 55,
    sex: 'male',
    smoker: false,
    heightCm: 170,
    volunteerId: user.id,
  } as Patient;

  beforeEach(async () => {
    repo = {
      findOneBy: jest.fn().mockResolvedValue(null),
      create: jest.fn((x) => x),
      save: jest.fn((x) => Promise.resolve(x)),
      find: jest.fn(),
    };
    patientsService = { getEntity: jest.fn().mockResolvedValue(patient) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthRecordsService,
        { provide: getRepositoryToken(HealthRecord), useValue: repo },
        { provide: PatientsService, useValue: patientsService },
      ],
    }).compile();

    service = module.get(HealthRecordsService);
  });

  it('rejects a visit number outside 1-4', async () => {
    await expect(
      service.save('p1', 0, { visitDate: '2024-01-01' } as any, user),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.save('p1', 5, { visitDate: '2024-01-01' } as any, user),
    ).rejects.toThrow(BadRequestException);
  });

  it('checks patient access via PatientsService.getEntity before saving', async () => {
    await service.save('p1', 1, { visitDate: '2024-01-01' } as any, user);
    expect(patientsService.getEntity).toHaveBeenCalledWith('p1', user);
  });

  it('computes BMI from patient height and entered weight', async () => {
    const result = await service.save(
      'p1',
      1,
      { visitDate: '2024-01-01', weightKg: 80 } as any,
      user,
    );
    // 80 / (1.70)^2 = 27.68...
    expect(result.bmi).toBeCloseTo(27.7, 1);
  });

  it('leaves BMI null when weight is not provided', async () => {
    const result = await service.save('p1', 1, { visitDate: '2024-01-01' } as any, user);
    expect(result.bmi).toBeNull();
  });

  it('computes CVD risk when dtxFpg, waistCm and systolicBp are all present', async () => {
    const result = await service.save(
      'p1',
      1,
      { visitDate: '2024-01-01', waistCm: 90, systolicBp: 150, dtxFpg: 130 } as any,
      user,
    );
    expect(result.cvdScore).not.toBeNull();
    expect(result.cvdRiskLevel).not.toBeNull();
    expect(result.cvdRiskPercent).not.toBeNull();
  });

  it('does not compute CVD risk when systolicBp is missing', async () => {
    const result = await service.save(
      'p1',
      1,
      { visitDate: '2024-01-01', waistCm: 90, dtxFpg: 130 } as any,
      user,
    );
    expect(result.cvdScore).toBeNull();
  });

  it('does not compute CVD risk when dtxFpg is missing', async () => {
    const result = await service.save(
      'p1',
      1,
      { visitDate: '2024-01-01', waistCm: 90, systolicBp: 150 } as any,
      user,
    );
    expect(result.cvdScore).toBeNull();
  });

  it('does not compute CVD risk when waistCm is missing', async () => {
    const result = await service.save(
      'p1',
      1,
      { visitDate: '2024-01-01', systolicBp: 150, dtxFpg: 130 } as any,
      user,
    );
    expect(result.cvdScore).toBeNull();
  });

  it('stores the 2Q depression screen only on visit 1', async () => {
    const v1 = await service.save(
      'p1',
      1,
      { visitDate: '2024-01-01', q1Depressed: true, q2Anhedonia: false } as any,
      user,
    );
    expect(v1.q1Depressed).toBe(true);
    expect(v1.q2Anhedonia).toBe(false);

    const v2 = await service.save(
      'p1',
      2,
      { visitDate: '2024-02-01', q1Depressed: true, q2Anhedonia: true } as any,
      user,
    );
    expect(v2.q1Depressed).toBeNull();
    expect(v2.q2Anhedonia).toBeNull();
  });

  it('stores self-care behavior only on visits 2 and up', async () => {
    const v1 = await service.save(
      'p1',
      1,
      { visitDate: '2024-01-01', selfCareBehavior: 'improved' } as any,
      user,
    );
    expect(v1.selfCareBehavior).toBeNull();

    const v3 = await service.save(
      'p1',
      3,
      { visitDate: '2024-03-01', selfCareBehavior: 'improved' } as any,
      user,
    );
    expect(v3.selfCareBehavior).toBe('improved');
  });

  it('classifies post-behavior DTX category only on visit 4', async () => {
    const v2 = await service.save(
      'p1',
      2,
      { visitDate: '2024-02-01', dtxFpg: 130 } as any,
      user,
    );
    expect(v2.dtxCategory).toBeNull();

    const v4 = await service.save(
      'p1',
      4,
      { visitDate: '2024-04-01', dtxFpg: 130 } as any,
      user,
    );
    expect(v4.dtxCategory).toBe('suspected');
  });

  it('reuses the existing record row when one already exists for that visit', async () => {
    const existing = { id: 'existing-record', patientId: 'p1', visitNumber: 1 } as HealthRecord;
    repo.findOneBy.mockResolvedValue(existing);
    const result = await service.save('p1', 1, { visitDate: '2024-01-01' } as any, user);
    expect(repo.create).not.toHaveBeenCalled();
    expect(result.id).toBe('existing-record');
  });
});
