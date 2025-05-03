import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/SignUp.dto';
import { LogInDto } from './dto/LogIn.dto';
import { ResponseDto } from './dto/Response.dto';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signUp(@Body() signUpDto: SignUpDto): Promise<ResponseDto> {
    return await this.authService.signUp(signUpDto);
  }

  @Post('login')
  async login(@Body() logInDto: LogInDto) {
    return await this.authService.logIn(logInDto);
  }
}
