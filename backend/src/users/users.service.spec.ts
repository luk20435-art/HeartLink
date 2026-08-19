import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService, toPublicUser } from './users.service';
import { User } from './user.entity';
import { UserRole } from './user-role.enum';
import { PatientsService } from '../patients/patients.service';

jest.mock('bcrypt');

describe('toPublicUser', () => {
  it('strips passwordHash and reset-token fields, keeping everything else', () => {
    const user = {
      id: 'u1',
      fullName: 'Test',
      email: 'a@b.com',
      passwordHash: 'secret-hash',
      resetPasswordTokenHash: 'reset-hash',
      resetPasswordExpiresAt: new Date(),
      role: UserRole.VOLUNTEER,
    } as User;

    const publicUser = toPublicUser(user) as Record<string, unknown>;

    expect(publicUser).not.toHaveProperty('passwordHash');
    expect(publicUser).not.toHaveProperty('resetPasswordTokenHash');
    expect(publicUser).not.toHaveProperty('resetPasswordExpiresAt');
    expect(publicUser.id).toBe('u1');
    expect(publicUser.fullName).toBe('Test');
    expect(publicUser.email).toBe('a@b.com');
  });
});

describe('UsersService', () => {
  let service: UsersService;
  let repo: {
    findOneBy: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let patientsService: { countByVolunteer: jest.Mock };

  const baseUser: User = {
    id: 'u1',
    fullName: 'Test User',
    email: 'test@example.com',
    phone: '0800000000',
    passwordHash: 'stored-hash',
    role: UserRole.VOLUNTEER,
    resetPasswordTokenHash: null,
    resetPasswordExpiresAt: null,
  } as User;

  beforeEach(async () => {
    repo = {
      findOneBy: jest.fn(),
      save: jest.fn((x) => Promise.resolve(x)),
      find: jest.fn(),
      create: jest.fn((x) => x),
      update: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    patientsService = { countByVolunteer: jest.fn().mockResolvedValue(new Map()) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: repo },
        { provide: PatientsService, useValue: patientsService },
      ],
    }).compile();

    service = module.get(UsersService);
    jest.clearAllMocks();
    repo.save.mockImplementation((x) => Promise.resolve(x));
    patientsService.countByVolunteer.mockResolvedValue(new Map());
  });

  describe('changePassword', () => {
    it('rejects when the current password does not match', async () => {
      repo.findOneBy.mockResolvedValue({ ...baseUser });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.changePassword('u1', { currentPassword: 'wrong', newPassword: 'newpass123' }),
      ).rejects.toThrow(UnauthorizedException);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('hashes and saves the new password, returning a stripped user', async () => {
      repo.findOneBy.mockResolvedValue({ ...baseUser });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');

      const result = (await service.changePassword('u1', {
        currentPassword: 'correct',
        newPassword: 'newpass123',
      })) as Record<string, unknown>;

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ passwordHash: 'new-hash' }),
      );
      expect(result).not.toHaveProperty('passwordHash');
    });
  });

  describe('consumeResetToken', () => {
    it('returns false when no reset token was ever issued', async () => {
      repo.findOneBy.mockResolvedValue({ ...baseUser, resetPasswordTokenHash: null });
      const ok = await service.consumeResetToken('u1', 'token', 'newpass');
      expect(ok).toBe(false);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('returns false when the reset token has expired', async () => {
      repo.findOneBy.mockResolvedValue({
        ...baseUser,
        resetPasswordTokenHash: 'hash',
        resetPasswordExpiresAt: new Date(Date.now() - 1000),
      });
      const ok = await service.consumeResetToken('u1', 'token', 'newpass');
      expect(ok).toBe(false);
    });

    it('returns false when the token does not match the stored hash', async () => {
      repo.findOneBy.mockResolvedValue({
        ...baseUser,
        resetPasswordTokenHash: 'hash',
        resetPasswordExpiresAt: new Date(Date.now() + 60_000),
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      const ok = await service.consumeResetToken('u1', 'wrong-token', 'newpass');
      expect(ok).toBe(false);
    });

    it('resets the password and clears the reset token when everything checks out', async () => {
      repo.findOneBy.mockResolvedValue({
        ...baseUser,
        resetPasswordTokenHash: 'hash',
        resetPasswordExpiresAt: new Date(Date.now() + 60_000),
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('fresh-hash');

      const ok = await service.consumeResetToken('u1', 'correct-token', 'newpass123');

      expect(ok).toBe(true);
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          passwordHash: 'fresh-hash',
          resetPasswordTokenHash: null,
          resetPasswordExpiresAt: null,
        }),
      );
    });
  });

  describe('findAllWithPatientCounts', () => {
    it('strips sensitive fields and attaches patient counts only for volunteers', async () => {
      const staffUser = { ...baseUser, id: 'staff-1', role: UserRole.STAFF };
      const volunteerUser = { ...baseUser, id: 'vol-1', role: UserRole.VOLUNTEER };
      repo.find.mockResolvedValue([staffUser, volunteerUser]);
      patientsService.countByVolunteer.mockResolvedValue(new Map([['vol-1', 5]]));

      const result = await service.findAllWithPatientCounts();

      const staffResult = result.find((u) => u.id === 'staff-1')!;
      const volResult = result.find((u) => u.id === 'vol-1')!;

      expect(staffResult).not.toHaveProperty('passwordHash');
      expect(staffResult.patientCount).toBeNull();
      expect(volResult.patientCount).toBe(5);
    });
  });
});
