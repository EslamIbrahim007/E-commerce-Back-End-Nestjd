import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SignUpDto } from './dto/SignUp.dto';
import { LogInDto } from './dto/LogIn.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ResponseDto } from './dto/Response.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async signUp(signUpDto: SignUpDto): Promise<ResponseDto> {
    //1- check if user already exists
    const user = await this.usersRepository.findOne({
      where: { email: signUpDto.email },
    });
    if (user) {
      throw new ConflictException('User already exists');
    }
    //2- hash the password
    const saltOrRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10');
    const hashedPassword = await bcrypt.hash(signUpDto.password, saltOrRounds);
    //3- create a new user
    const newUser = this.usersRepository.create({
      ...signUpDto,
      password: hashedPassword,
    });
    // 4- save the user first
    const savedUser = await this.usersRepository.save(newUser);
    // 5- generate a jwt token
    const payload = { id: savedUser.id, role: savedUser.role };
    const token = this.jwtService.sign(payload);
    //6- return the user and the token
    return new ResponseDto(savedUser, token);
  }

  async logIn(logInDto: LogInDto): Promise<ResponseDto> {
    //1- check if user exists
    const user = await this.usersRepository.findOne({
      where: { email: logInDto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    //2- check if password is correct
    const isPasswordCorrect = await bcrypt.compare(
      logInDto.password,
      user.password,
    );
    if (!isPasswordCorrect) {
      throw new UnauthorizedException('Invalid credentials');
    }
    //3- generate a jwt token
    const payload = { id: user.id, role: user.role };
    const token = this.jwtService.sign(payload);
    //4- return the user and the token
    return new ResponseDto(user, token);
  }
}
