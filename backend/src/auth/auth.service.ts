import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { UserRole } from '../users/user-role.enum';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const GENERIC_FORGOT_MESSAGE = 'หากมีบัญชีนี้ในระบบ เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปแล้ว';

/**
 * Cap on self-registered staff (เจ้าหน้าที่หน่วยงาน) accounts — client asked to allow
 * only 2 more staff sign-ups from the point this was added (1 existing + 2 = 3).
 * Re-checked against the live count on every registration, so it stays correct
 * even if accounts are later added/removed by other means.
 */
const MAX_STAFF_ACCOUNTS = 3;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private toAuthResponse(user: User) {
    return {
      accessToken: this.jwtService.sign({ sub: user.id, role: user.role }),
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        organization: user.organization,
        position: user.position,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  async register(dto: RegisterDto) {
    const [existingPhone, existingEmail] = await Promise.all([
      this.usersService.findByPhone(dto.phone),
      this.usersService.findByEmail(dto.email),
    ]);
    if (existingPhone) {
      throw new ConflictException('เบอร์โทรศัพท์นี้ถูกใช้สมัครสมาชิกแล้ว');
    }
    if (existingEmail) {
      throw new ConflictException('อีเมลนี้ถูกใช้สมัครสมาชิกแล้ว');
    }
    if (dto.role === UserRole.STAFF) {
      const staffCount = await this.usersService.countByRole(UserRole.STAFF);
      if (staffCount >= MAX_STAFF_ACCOUNTS) {
        throw new ForbiddenException(
          'ขณะนี้ครบจำนวนบัญชีเจ้าหน้าที่หน่วยงานที่รับสมัครได้แล้ว กรุณาติดต่อผู้ดูแลระบบ',
        );
      }
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      phone: dto.phone,
      email: dto.email,
      fullName: dto.fullName,
      passwordHash,
      role: dto.role,
    });
    return this.toAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmailOrPhone(dto.identifier);
    if (!user) {
      throw new UnauthorizedException('อีเมล/เบอร์โทรศัพท์หรือรหัสผ่านไม่ถูกต้อง');
    }
    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('อีเมล/เบอร์โทรศัพท์หรือรหัสผ่านไม่ถูกต้อง');
    }
    return this.toAuthResponse(user);
  }

  /**
   * ⚠️ DEV-FRIENDLY FALLBACK: no email/SMS provider is configured yet, so instead
   * of emailing the reset link we return it directly in the response (`devResetUrl`).
   * Before production: wire up a real email send here and stop returning `devResetUrl`
   * (keep only the generic `message`), so the endpoint can't be used to confirm
   * whether an identifier is registered.
   */
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmailOrPhone(dto.identifier);
    if (!user) {
      return { message: GENERIC_FORGOT_MESSAGE };
    }

    const token = randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(token, 10);
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await this.usersService.setResetToken(user.id, tokenHash, expiresAt);

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
    const devResetUrl = `${frontendUrl}/reset-password?identifier=${encodeURIComponent(
      dto.identifier,
    )}&token=${token}`;

    return { message: GENERIC_FORGOT_MESSAGE, devResetUrl };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.usersService.findByEmailOrPhone(dto.identifier);
    if (!user) {
      throw new UnauthorizedException('ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุ');
    }
    const ok = await this.usersService.consumeResetToken(user.id, dto.token, dto.newPassword);
    if (!ok) {
      throw new UnauthorizedException('ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุ');
    }
    return { message: 'ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว' };
  }
}
