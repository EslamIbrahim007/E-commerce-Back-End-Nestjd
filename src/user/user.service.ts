import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Repository, FindManyOptions, Equal, Like } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserResponseDto } from './dto/user-response.dto';
import { Role } from './enums/role.enum';

interface UserQuery {
  limit?: string | number;
  skip?: string | number;
  sort?: string | Record<string, 'ASC' | 'DESC'>;
  name?: string;
  email?: string;
  role?: string;
}
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async create(
    createUserDto: CreateUserDto,
  ): Promise<{ status: number; message: string; data: UserResponseDto }> {
    const email = createUserDto.email.toLowerCase();
    // check if the email exist
    const existingUser = await this.usersRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new HttpException('Email already exists', HttpStatus.BAD_REQUEST);
    }
    // hash the password
    const saltOrRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10');
    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      saltOrRounds,
    );
    // create the  user
    const user = this.usersRepository.create({
      ...createUserDto,
      email,
      password: hashedPassword,
      role: createUserDto.role || Role.USER,
    });
    // Save user within a transaction for consistency
    const savedUser = await this.usersRepository.manager.transaction(
      async (transactionalEntityManager) => {
        return await transactionalEntityManager.save(User, user);
      },
    );
    const userResponse = plainToInstance(UserResponseDto, savedUser);
    // create a new user with the given payload and the email from the createUserDto
    // and save it to the database.
    return {
      status: HttpStatus.CREATED, // Use 201 for resource creation
      message: 'User created successfully',
      data: userResponse,
    };
  }

  async findAll(query: UserQuery): Promise<{
    status: number;
    message: string;
    data: UserResponseDto[];
    meta: { total: number; limit: number; skip: number };
  }> {
    const { limit, skip, sort, name, email, role } = query;

    // Validate and parse pagination
    const parsedLimit = limit ? Number(limit) : 10; // Default limit
    const parsedSkip = skip ? Number(skip) : 0;
    if (isNaN(parsedLimit) || parsedLimit < 0) {
      throw new Error('Invalid limit: must be a non-negative number');
    }
    if (isNaN(parsedSkip) || parsedSkip < 0) {
      throw new Error('Invalid skip: must be a non-negative number');
    }

    const options: FindManyOptions<User> = {
      take: parsedLimit,
      skip: parsedSkip,
    };
    // Handle sorting
    if (sort) {
      try {
        const sortObj =
          typeof sort === 'string'
            ? (JSON.parse(sort) as Record<string, 'ASC' | 'DESC'>)
            : sort;
        const validSortFields = ['name', 'email', 'role', 'createdAt'];
        for (const key of Object.keys(sortObj)) {
          if (!validSortFields.includes(key)) {
            throw new Error(`Invalid sort field: ${key}`);
          }
        }
        options.order = sortObj;
      } catch {
        throw new Error('Invalid sort parameter: must be valid JSON or object');
      }
    }

    // Handle filters
    const filters = { name, email, role };
    options.where = {};
    for (const [key, value] of Object.entries(filters)) {
      if (typeof value === 'string' && value) {
        if (key === 'name' || key === 'email') {
          (options.where as Record<string, any>)[key] = Like(`%${value}%`); // Partial match
        } else {
          (options.where as Record<string, any>)[key] = Equal(value); // Exact match for role
        }
      }
    }
    if (Object.keys(options.where).length === 0) {
      delete options.where;
    }

    // Execute query

    const [results, total] = await this.usersRepository.findAndCount(options);
    // Transform User entities to UserResponseDto
    const transformedResults = plainToInstance(UserResponseDto, results, {
      excludeExtraneousValues: true, // Only include @Expose fields
    });
    return {
      status: 200,
      message: 'Users fetched successfully',
      data: transformedResults,
      meta: { total, limit: parsedLimit, skip: parsedSkip },
    };
  }

  async findOne(id: string): Promise<{ status: number; data: User }> {
    const user = await this.usersRepository.findOne({
      where: { id: parseInt(id) },
      select: [
        'id',
        'name',
        'email',
        'role',
        'avatar',
        'age',
        'phoneNumber',
        'address',
        'active',
        'gender',
      ],
    });
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
    const userId = parseInt(id);
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Fetch updated user to return
    const updatedUser = await this.usersRepository.save({
      ...user,
      ...updateUserDto,
    });

    return {
      status: 200,
      message: 'User updated successfully',
      data: updatedUser,
    };
  }

  async remove(id: string): Promise<{ status: number; message: string }> {
    const user = await this.usersRepository.findOne({
      where: { id: parseInt(id) },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.usersRepository.delete(parseInt(id));
    return {
      status: 200,
      message: 'User deleted successfully',
    };
  }
}
