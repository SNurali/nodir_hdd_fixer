import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly _reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this._reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user || !user.role_name) {
            throw new ForbiddenException('Access denied: no role assigned');
        }

        const hasRole = requiredRoles.includes(user.role_name);
        if (!hasRole) {
            throw new ForbiddenException(
                `Access denied: requires one of [${requiredRoles.join(', ')}]`,
            );
        }

        return true;
    }
}
