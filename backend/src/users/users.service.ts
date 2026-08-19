import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { UserRole } from './user-role.enum';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { PatientsService } from '../patients/patients.service';

export function toPublicUser(user: User) {
  const { passwordHash, resetPasswordTokenHash, resetPasswordExpiresAt, ...rest } = user;
  return rest;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
    private readonly patientsService: PatientsService,
  ) {}

  findByPhone(phone: string) {
    return this.repo.findOneBy({ phone });
  }

  findByEmail(email: string) {
    return this.repo.findOneBy({ email });
  }

  findByEmailOrPhone(identifier: string) {
    return this.repo
      .createQueryBuilder('user')
      .where('user.email = :identifier OR user.phone = :identifier', {
        identifier,
      })
      .getOne();
  }

  findById(id: string) {
    return this.repo.findOneBy({ id });
  }

  create(data: {
    phone: string;
    email: string;
    fullName: string;
    passwordHash: string;
    role: UserRole;
    organization?: string | null;
    position?: string | null;
  }) {
    const user = this.repo.create(data);
    return this.repo.save(user);
  }

  private async getOrThrow(id: string): Promise<User> {
    const user = await this.repo.findOneBy({ id });
    if (!user) {
      throw new NotFoundException('ไม่พบผู้ใช้งาน');
    }
    return user;
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    const user = await this.getOrThrow(id);

    if (dto.email && dto.email !== user.email) {
      const existing = await this.findByEmail(dto.email);
      if (existing) {
        throw new ConflictException('อีเมลนี้ถูกใช้แล้ว');
      }
      user.email = dto.email;
    }
    if (dto.phone && dto.phone !== user.phone) {
      const existing = await this.findByPhone(dto.phone);
      if (existing) {
        throw new ConflictException('เบอร์โทรศัพท์นี้ถูกใช้แล้ว');
      }
      user.phone = dto.phone;
    }
    if (dto.fullName) user.fullName = dto.fullName;
    if (dto.organization !== undefined) user.organization = dto.organization || null;
    if (dto.position !== undefined) user.position = dto.position || null;

    const saved = await this.repo.save(user);
    return toPublicUser(saved);
  }

  async changePassword(id: string, dto: ChangePasswordDto) {
    const user = await this.getOrThrow(id);
    const matches = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException('รหัสผ่านปัจจุบันไม่ถูกต้อง');
    }
    user.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    const saved = await this.repo.save(user);
    return toPublicUser(saved);
  }

  async updateAvatar(id: string, avatarUrl: string) {
    const user = await this.getOrThrow(id);
    user.avatarUrl = avatarUrl;
    const saved = await this.repo.save(user);
    return toPublicUser(saved);
  }

  async setResetToken(id: string, tokenHash: string, expiresAt: Date) {
    await this.repo.update(id, {
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpiresAt: expiresAt,
    });
  }

  async consumeResetToken(id: string, token: string, newPassword: string): Promise<boolean> {
    const user = await this.getOrThrow(id);
    if (!user.resetPasswordTokenHash || !user.resetPasswordExpiresAt) {
      return false;
    }
    if (user.resetPasswordExpiresAt.getTime() < Date.now()) {
      return false;
    }
    const matches = await bcrypt.compare(token, user.resetPasswordTokenHash);
    if (!matches) {
      return false;
    }
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.resetPasswordTokenHash = null;
    user.resetPasswordExpiresAt = null;
    await this.repo.save(user);
    return true;
  }

  countByRole(role: UserRole): Promise<number> {
    return this.repo.count({ where: { role } });
  }

  /** Staff-only admin view: every user account plus, for volunteers, how many patients they manage. */
  async findAllWithPatientCounts() {
    const users = await this.repo.find({ order: { createdAt: 'ASC' } });
    const counts = await this.patientsService.countByVolunteer();
    return users.map((user) => ({
      ...toPublicUser(user),
      patientCount: user.role === UserRole.VOLUNTEER ? (counts.get(user.id) ?? 0) : null,
    }));
  }
}
