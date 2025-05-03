import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { SignUpDto } from './dto/SignUp.dto';
import { LogInDto } from './dto/LogIn.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { MoreThan, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ResponseDto } from './dto/Response.dto';
import { MailService } from 'src/mail/mail.service';
import { addHours } from 'date-fns';
import * as crypto from 'crypto';
import { ResetPasswordDto } from './dto/ResetPassword.dto';
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
    private mailService: MailService,
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

  async forgotPassword(email: string): Promise<void> {
    //1- check if user exists
    const user = await this.usersRepository.findOne({
      where: { email: email },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    //2- Generate raw and hashed reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    //3-Set token and expiry on user
    user.resetPasswordToken = hashedResetToken;
    user.resetPasswordExpires = addHours(new Date(), 1); // 1 hour from now

    await this.usersRepository.save(user);

    //4- send the reset token to the user's email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const html = `
    <p>You are receiving this email because you (or someone else) have requested the reset of a password.</p>
    <p>Please click the link below to reset your password:</p>
    <a href="${resetUrl}">Reset Password</a>
    <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
    <p>
    This link will expire in 1 hour. So please reset your password as soon as possible.
    </p>
    <p>
    Regards,
    The Support Team
    </p>
    `;
    await this.mailService.sendMail({
      to: user.email,
      subject: 'Reset Password',
      html,
    });
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    //1- hash the token to compare it with the hashed token in the database
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetPasswordDto.token)
      .digest('hex');

    //2- check if user exists
    const user = await this.usersRepository.findOne({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: MoreThan(new Date()),
      },
    });
    if (!user) {
      throw new BadRequestException('Token is invalid or has expired');
    }
    //3- hash the password
    const saltOrRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10');
    const hashedPassword = await bcrypt.hash(
      resetPasswordDto.password,
      saltOrRounds,
    );
    //4- update the user's password and clear reset fields
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await this.usersRepository.save(user);
  }
}
