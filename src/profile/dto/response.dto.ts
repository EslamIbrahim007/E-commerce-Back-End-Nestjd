import { User } from 'src/user/entities/user.entity';

export class ResponseDto {
  user: {
    id: string;
    email: string;
    role: string;
    name: string;
    avatar: string;
    age: number;
    phoneNumber: string;
    address: string;
    active: boolean;
    gender: string;
    createdAt: Date;
  };
  // to convert the entity to a dto
  constructor(user: User) {
    this.user = {
      id: user.id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      avatar: user.avatar,
      age: user.age,
      phoneNumber: user.phoneNumber,
      address: user.address,
      active: user.active,
      gender: user.gender,
      createdAt: user.createdAt,
    };
  }
}
