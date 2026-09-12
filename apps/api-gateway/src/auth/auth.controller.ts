import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { LoginDto, RegisterDto } from '@app/common';

@ApiTags('auth')
@Controller('api/auth')
export class AuthController {
  constructor(@Inject('AUTH_SERVICE') private readonly authClient: ClientProxy) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return firstValueFrom(this.authClient.send('auth.register', dto));
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return firstValueFrom(this.authClient.send('auth.login', dto));
  }
}
