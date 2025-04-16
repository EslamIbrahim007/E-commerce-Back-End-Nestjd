import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Roles } from '../decorator/role.decorator';
import { Reflector } from '@nestjs/core';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);
    console.log('Extracted Token:', token); // Log the token

    const roles = this.reflector.get(Roles, context.getHandler());
    console.log('Required Roles:', roles); // Log the expected roles
    if (!roles) {
      return true;
    }
    if (!token) {
      throw new UnauthorizedException('Token not provided');
    }

    try {
      interface JwtPayload {
        role: string;
        [key: string]: any;
      }

      console.log('JWT_SECRET_KEY:', process.env.JWT_SECRET_KEY); // Log the secret (for debugging only, remove in production)
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: process.env.JWT_SECRET_KEY,
      });
      console.log('Decoded Payload:', payload); // Log the payload

      if (!payload.role || !roles.includes(payload.role)) {
        console.log(
          'Role check failed. Payload role:',
          payload.role,
          'Required roles:',
          roles,
        );
        throw new UnauthorizedException('Role not authorized');
      }

      request['user'] = payload;
      return true;
    } catch (error) {
      console.error('JWT Verification Error:', (error as Error).message); // Log the specific error
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    console.log('Authorization Header:', request.headers.authorization); // Log the full header
    return type === 'Bearer' ? token : undefined;
  }
}
