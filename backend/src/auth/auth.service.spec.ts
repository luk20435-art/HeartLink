import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, ForbiddenException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/user-role.enum';

describe('AuthService.register', () => {
  let service: AuthService;
  let usersService: {
    findByPhone: jest.Mock;
    findByEmail: jest.Mock;
    countByRole: jest.Mock;
    create: jest.Mock;
  };

  const dto = {
    fullName: 'Test User',
    phone: '0812345678',
    email: 'test@example.com',
    password: 'secret123',
    role: UserRole.STAFF,
  };

  beforeEach(async () => {
    usersService = {
      findByPhone: jest.fn().mockResolvedValue(null),
      findByEmail: jest.fn().mockResolvedValue(null),
      countByRole: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue({
        id: 'u1',
        phone: dto.phone,
        email: dto.email,
        fullName: dto.fullName,
        role: dto.role,
        organization: null,
        position: null,
        avatarUrl: null,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: { sign: jest.fn().mockReturnValue('signed-token') } },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('rejects when the phone number is already registered', async () => {
    usersService.findByPhone.mockResolvedValue({ id: 'existing' });
    await expect(service.register(dto)).rejects.toThrow(ConflictException);
  });

  it('rejects when the email is already registered', async () => {
    usersService.findByEmail.mockResolvedValue({ id: 'existing' });
    await expect(service.register(dto)).rejects.toThrow(ConflictException);
  });

  it('allows a staff registration when under the cap', async () => {
    usersService.countByRole.mockResolvedValue(2); // cap is 3
    await expect(service.register(dto)).resolves.toEqual(
      expect.objectContaining({ accessToken: 'signed-token' }),
    );
    expect(usersService.create).toHaveBeenCalled();
  });

  it('rejects a staff registration once the cap is reached', async () => {
    usersService.countByRole.mockResolvedValue(3); // cap is 3
    await expect(service.register(dto)).rejects.toThrow(ForbiddenException);
    expect(usersService.create).not.toHaveBeenCalled();
  });

  it('does not check the staff cap at all for volunteer registrations', async () => {
    usersService.countByRole.mockResolvedValue(999);
    await expect(service.register({ ...dto, role: UserRole.VOLUNTEER })).resolves.toEqual(
      expect.objectContaining({ accessToken: 'signed-token' }),
    );
    expect(usersService.countByRole).not.toHaveBeenCalled();
  });
});
