import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../database/entities';

export interface JwtPayload {
    sub: string;
    role: string;
    roleName: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(
        private readonly configService: ConfigService,
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>,
        private reflector: Reflector,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
            context.getHandler(),
            context.getClass(),
        ]);
        const request = context.switchToHttp().getRequest();
        let token: string | undefined;

        // Try Bearer token first
        const authHeader = request.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }
        // Fallback to cookie
        else if (request.cookies?.access_token) {
            token = request.cookies.access_token;
        }

        if (!token) {
            if (isPublic) return true;
            throw new UnauthorizedException('Missing or invalid authorization header or cookie');
        }

        try {
            const secret = this.configService.get<string>('JWT_SECRET');
            const payload = jwt.verify(token, secret!) as JwtPayload;
            console.log(`[AUTH DEBUG] Payload sub: ${payload.sub}`);

            const user = await this.userRepo.findOne({
                where: { id: payload.sub },
                relations: ['role'],
            });

            if (!user) {
                console.log(`[AUTH DEBUG] User not found for sub: ${payload.sub}`);
                if (isPublic) return true;
                throw new UnauthorizedException('User not found');
            }
            console.log(`[AUTH DEBUG] Found user: ${user.phone} with role: ${user.role.name_eng}`);

            request.user = {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                phone: user.phone,
                role_id: user.role_id,
                role_name: user.role.name_eng.toLowerCase(),
                preferred_language: user.preferred_language,
            };

            return true;
        } catch (error) {
            if (isPublic) return true;
            if (error instanceof UnauthorizedException) throw error;
            throw new UnauthorizedException('Invalid or expired token');
        }
    }
}
