import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from '@app/common';

// TCP-only — no HTTP. All handlers are internal, reachable only by the API gateway.
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern('auth.register')
  register(@Payload() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @MessagePattern('auth.login')
  login(@Payload() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @MessagePattern('auth.validateUser')
  validateUser(@Payload() userId: string) {
    return this.authService.validateUserById(userId);
  }
}
