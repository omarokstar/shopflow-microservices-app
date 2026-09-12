import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { LoginDto, RegisterDto, Role } from '@app/common';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.users.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user = this.users.create({
      email: dto.email,
      passwordHash,
      fullName: dto.fullName,
      role: Role.CUSTOMER,
    });
    await this.users.save(user);

    return this.buildTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.users.findOne({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.buildTokens(user);
  }

  async validateUserById(userId: string) {
    return this.users.findOne({ where: { id: userId } });
  }

  private buildTokens(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    // Issue short-lived access token and long-lived refresh token.
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
    };
  }
}
