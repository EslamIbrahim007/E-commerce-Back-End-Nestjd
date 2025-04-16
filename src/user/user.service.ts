import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './user.schema';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
  ) {}

  async create(
    createUserDto: CreateUserDto,
  ): Promise<{ status: number; message: string; data: User }> {
    // check if the email exist
    const email = await this.userModel.findOne({ email: createUserDto.email });
    if (email) {
      throw new HttpException('Email already exists', 400);
    }
    // hash the password
    const saltOrRounds = 10;
    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      saltOrRounds,
    );
    // create the  user
    const user = {
      password: hashedPassword,
      role: createUserDto.role ?? 'user',
    };
    // create a new user with the given payload and the email from the createUserDto
    // and save it to the database.
    return {
      status: 200,
      message: 'User created succfully',
      data: await this.userModel.create({ ...createUserDto, ...user }),
    };
  }

  async findAll(
    query: Record<string, unknown>,
  ): Promise<{ status: number; message: string; data: User }> {
    const { limit, skip, sort, name, email, role } = query;
    const resultes = await this.userModel
      .find({ name, email, role })
      .limit(limit as number)
      .skip(skip as number)
      .sort(sort as string)
      .select('-password -__v');
    return {
      status: 200,
      message: 'User created succfully',
      data: resultes as User[],
    };
  }

  async findOne(id: string): Promise<{ status: number; data: User }> {
    const user = await this.userModel.findById(id).select('-password -__v');
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      status: 200,
      data: user,
    };
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<{ status: number; message: string; data: User }> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const updateUser = await this.userModel.findByIdAndUpdate(
      id,
      updateUserDto,
      {
        new: true,
      },
    );
    return {
      status: 200,
      message: 'User updated successfully',
      data: updateUser as User,
    };
  }

  async remove(id: string): Promise<{ status: number; message: string }> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.userModel.findByIdAndDelete(id);
    return {
      status: 200,
      message: 'User deleted successfully',
    };
  }
}
