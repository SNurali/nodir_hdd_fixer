import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

export enum UserRole {
  GUEST = 'guest',
  CLIENT = 'client',
  OPERATOR = 'operator',
  MASTER = 'master',
  ADMIN = 'admin',
  SYSTEM = 'system',
}

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) {
      return true; // If no roles required, allow access
    }
    
    const { user } = context.switchToHttp().getRequest();
    
    if (!user || !user.role) {
      return false; // No user or no role - deny access
    }
    
    // Check if user role is in required roles
    return requiredRoles.some(role => role === user.role.name_eng);
  }
}