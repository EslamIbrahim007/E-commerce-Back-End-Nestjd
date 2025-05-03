import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { ResponseDto } from './dto/response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

interface RequestWithUser extends Request {
  user: User;
}

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}
  async getProfile(req: RequestWithUser): Promise<ResponseDto> {
    // -1: Get user from request
    const user = req.user;
    if (!user) {
      throw new NotFoundException('User not found');
    }
    //-2 get the user info
    const userProfile = await this.usersRepository.findOneOrFail({
      where: { id: user.id },
    });
    if (!userProfile) {
      throw new NotFoundException();
    }
    //3 return the info
    return new ResponseDto(userProfile);
  }

  async updateProfile(
    req: RequestWithUser,
    updateProfileDto: UpdateProfileDto,
  ): Promise<ResponseDto> {
    // -1: Get user from request
    const user = req.user;
    if (!user) {
      throw new NotFoundException('User not found');
    }

    //-2 get the user info
    const userProfile = await this.usersRepository.findOne({
      where: { id: user.id },
    });
    if (!userProfile) {
      throw new NotFoundException('User profile not found');
    }

    //-3 Update user profile
    const updatedProfile = await this.usersRepository.preload({
      id: user.id,
      ...updateProfileDto,
    });

    if (!updatedProfile) {
      throw new BadRequestException('Failed to update profile');
    }
    await this.usersRepository.save(updatedProfile);

    return new ResponseDto(updatedProfile);
  }

  async deactivateAccount(req: RequestWithUser): Promise<{ message: string }> {
    const user = req.user;
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const userProfile = await this.usersRepository.findOne({
      where: { id: user.id },
    });
    if (!userProfile) {
      throw new NotFoundException('User profile not found');
    }

    const updatedProfile = await this.usersRepository.preload({
      id: user.id,
      active: false,
    });

    if (!updatedProfile) {
      throw new BadRequestException('Failed to deactivate account');
    }
    await this.usersRepository.save(updatedProfile);

    return {
      message: 'Account deactivated successfully',
    };
  }
}
