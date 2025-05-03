import { User } from 'src/user/entities/user.entity';

export class ResponseDto {
  user: {
    id: string;
    email: string;
    role: string;
  };
  token: string;
  // to convert the entity to a dto
  constructor(user: User, token: string) {
    this.user = {
      id: user.id.toString(),
      email: user.email,
      role: user.role,
    };
    this.token = token;
  }
}
