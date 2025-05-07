import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { Roles } from 'src/decorator/role.decorator';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';
import { User } from 'src/user/entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Role } from 'src/user/enums/role.enum';

interface RequestWithUser extends Request {
  user: User;
}

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.USER)
  get(@Req() req: RequestWithUser) {
    return this.profileService.getProfile(req);
  }
  @Patch('update')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.USER)
  update(
    @Req() req: RequestWithUser,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.profileService.updateProfile(req, updateProfileDto);
  }
  @Patch('deactive')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.USER)
  deactive(@Req() req: RequestWithUser) {
    return this.profileService.deactivateAccount(req);
  }
}
