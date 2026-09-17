import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ROLES_KEY, UserRole } from '../decorators/roles.decorator.js';

interface RequestWithUser extends Request {
  user?: {
    role?: string;
    isApproved?: boolean;
  };
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user || !user.role || !requiredRoles.includes(user.role as UserRole)) {
      throw new ForbiddenException(
        `Forbidden: Access requires one of the following roles: [${requiredRoles.join(', ')}]`,
      );
    }

    if (user.role === 'organizer' && user.isApproved === false) {
      throw new ForbiddenException(
        'Your organizer account is pending administrator verification. Please wait for an administrator to review and activate your account.',
      );
    }

    return true;
  }
}
