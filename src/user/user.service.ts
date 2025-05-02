import {
  BadRequestException,
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
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserResponseDto } from './dto/user-response.dto';
import { Role } from './enums/role.enum';
import { UserQueryDto } from './dto/Query-dto';

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

  async findAll(query: UserQueryDto): Promise<{
    status: number;
    message: string;
    data: UserResponseDto[];
    meta: { total: number; limit: number; skip: number };
  }> {
    const { limit, skip, sort, name, email, role } = query;
    // Build QueryBuilder
    const qb = this.usersRepository.createQueryBuilder('user');

    // Filters
    if (name) {
      qb.andWhere('user.name ILIKE :name', { name: `%${name}%` });
    }
    if (email) {
      qb.andWhere('user.email ILIKE :email', { email: `%${email}%` });
    }
    if (role) {
      qb.andWhere('user.role = :role', { role });
    }
    // Sorting
    if (sort) {
      let sortObj: Record<string, 'ASC' | 'DESC'>;
      try {
        sortObj = (
          typeof sort === 'string' ? JSON.parse(sort) : sort
        ) as Record<string, 'ASC' | 'DESC'>;
      } catch {
        throw new BadRequestException('Invalid sort format');
      }

      const validFields = ['name', 'email', 'role', 'createdAt'] as const;
      for (const field of Object.keys(sortObj)) {
        if (!validFields.includes(field as (typeof validFields)[number])) {
          throw new BadRequestException(`Cannot sort by ${field}`);
        }
        qb.addOrderBy(`user.${field}`, sortObj[field]);
      }
    } else {
      qb.addOrderBy('user.createdAt', 'DESC');
    }

    // Pagination
    qb.skip(skip).take(limit);
    // Execute
    const [results, total] = await qb.getManyAndCount();

    // Map to DTO
    const data = plainToInstance(UserResponseDto, results, {
      excludeExtraneousValues: true,
    });
    return {
      status: 200,
      message: 'Users fetched successfully',
      data,
      meta: { total, limit, skip },
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
