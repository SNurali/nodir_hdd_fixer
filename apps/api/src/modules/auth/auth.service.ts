import { Injectable, UnauthorizedException, ConflictException, Inject, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { createHash, randomBytes } from 'crypto';
import { UserEntity, ClientEntity, RoleEntity } from '../../database/entities';
import { TLoginDto, TRegisterDto, TAdminSetUserPasswordDto } from '@hdd-fixer/shared';
import { createLogger } from '../../common/logger/pino.logger';
import { NotificationsService } from '../notifications/notifications.service';

export interface GoogleUserData {
    googleId: string;
    email?: string;
    fullName: string;
    avatarUrl?: string;
}

@Injectable()
export class AuthService {
    private readonly logger = createLogger('AuthService');

    constructor(
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>,
        @InjectRepository(ClientEntity)
        private readonly clientRepo: Repository<ClientEntity>,
        @InjectRepository(RoleEntity)
        private readonly roleRepo: Repository<RoleEntity>,
        @Inject(ConfigService) private readonly config: ConfigService,
        private readonly notificationsService: NotificationsService,
    ) { }

    async register(dto: TRegisterDto) {
        const existingUser = await this.userRepo.findOne({
            where: [{ phone: dto.phone }, ...(dto.email ? [{ email: dto.email }] : [])],
        });
        if (existingUser) {
            throw new ConflictException('User already exists');
        }

        const clientRole = await this.roleRepo.findOne({
            where: { name_eng: 'client' },
        });

        if (!clientRole) {
            this.logger.error('Client role missing during registration');
            throw new Error('Client role not found');
        }

        const passwordHash = await bcrypt.hash(dto.password, 10);
        const user = this.userRepo.create({
            full_name: dto.full_name,
            phone: dto.phone,
            email: dto.email || null,
            telegram: dto.telegram?.trim() || null,
            password_hash: passwordHash,
            role_id: clientRole.id,
            preferred_language: dto.preferred_language || 'ru',
            gender: dto.gender || null,
            date_of_birth: dto.date_of_birth || null,
        });

        await this.userRepo.save(user);

        const client = this.clientRepo.create({
            user_id: user.id,
            full_name: dto.full_name,
            phone: dto.phone,
            telegram: dto.telegram?.trim() || null,
            email: dto.email || null,
            preferred_language: dto.preferred_language || 'ru',
            gender: dto.gender || null,
            date_of_birth: dto.date_of_birth || null,
        });
        await this.clientRepo.save(client);

        const tokens = this.generateTokens(user.id, clientRole.id, 'client');

        return {
            ...tokens,
            user: {
                id: user.id,
                full_name: user.full_name,
                role: 'client',
                avatar_url: user.avatar_url,
            },
        };
    }

    async login(dto: TLoginDto) {
        this.logger.log('Login attempt', { login: dto.login });

        // Find user by phone or email
        const user = await this.userRepo.findOne({
            where: [{ phone: dto.login }, { email: dto.login }],
            relations: ['role'],
        });

        if (!user || !user.password_hash) {
            this.logger.warn('Login failed - user not found', { login: dto.login });
            throw new UnauthorizedException('Invalid credentials');
        }

        const isValid = await bcrypt.compare(dto.password, user.password_hash);
        if (!isValid) {
            this.logger.warn('Login failed - invalid password', { login: dto.login });
            throw new UnauthorizedException('Invalid credentials');
        }

        this.logger.log('Login successful', { userId: user.id, login: dto.login });

        const roleName = user.role.name_eng.toLowerCase();
        const tokens = this.generateTokens(user.id, user.role_id, roleName);

        return {
            ...tokens,
            user: {
                id: user.id,
                full_name: user.full_name,
                role: roleName,
                avatar_url: user.avatar_url,
            },
        };
    }

    async refreshToken(refreshToken: string) {
        try {
            const secret = this.config.get<string>('JWT_REFRESH_SECRET');
            const payload = jwt.verify(refreshToken, secret!) as {
                sub: string;
                role: string;
                roleName: string;
            };

            const user = await this.userRepo.findOne({
                where: { id: payload.sub },
                relations: ['role'],
            });

            if (!user) {
                throw new UnauthorizedException('User not found');
            }

            const roleName = user.role.name_eng.toLowerCase();
            return this.generateTokens(user.id, user.role_id, roleName);
        } catch {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    async forgotPassword(login: string) {
        const normalizedLogin = (login || '').trim();
        if (!normalizedLogin) {
            throw new BadRequestException('Login is required');
        }

        const user = await this.userRepo.findOne({
            where: [{ phone: normalizedLogin }, { email: normalizedLogin }],
        });

        // Always return success to prevent account enumeration.
        if (!user) {
            return { success: true, message: 'If the account exists, reset instructions have been sent.' };
        }

        const rawToken = randomBytes(32).toString('hex');
        const tokenHash = this.hashResetToken(rawToken);
        const expiresMinutes = Number(this.config.get<string>('PASSWORD_RESET_EXPIRES_MINUTES', '30'));
        const expiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000);

        user.password_reset_token_hash = tokenHash;
        user.password_reset_expires_at = expiresAt;
        await this.userRepo.save(user);

        const webUrl = this.config.get<string>('WEB_URL', 'http://localhost:3003');
        const resetLink = `${webUrl}/login?reset_token=${rawToken}`;
        const subject = 'Сброс пароля Recovery.uz';
        const message = `Для сброса пароля перейдите по ссылке: ${resetLink}\nСсылка действует ${expiresMinutes} минут.`;

        try {
            if (user.email) {
                await this.notificationsService.sendEmail(user.email, subject, message, {
                    template: 'password-reset',
                    data: { resetLink, expiresMinutes },
                });
            } else if (user.phone) {
                await this.notificationsService.sendSMS(
                    user.phone,
                    `Recovery.uz: код сброса пароля ${rawToken}. Действует ${expiresMinutes} мин.`,
                );
            }
        } catch (error) {
            this.logger.error('Failed to send forgot password notification', { userId: user.id, error });
        }

        const result: Record<string, unknown> = {
            success: true,
            message: 'If the account exists, reset instructions have been sent.',
        };

        if (this.config.get('NODE_ENV') !== 'production') {
            result.debug_reset_token = rawToken;
        }

        return result;
    }

    async resetPassword(token: string, newPassword: string) {
        const rawToken = (token || '').trim();
        if (!rawToken) {
            throw new BadRequestException('Reset token is required');
        }

        const tokenHash = this.hashResetToken(rawToken);
        const user = await this.userRepo.findOne({
            where: { password_reset_token_hash: tokenHash },
        });

        if (!user || !user.password_reset_expires_at || user.password_reset_expires_at.getTime() < Date.now()) {
            throw new UnauthorizedException('Invalid or expired reset token');
        }

        user.password_hash = await bcrypt.hash(newPassword, 10);
        user.password_reset_token_hash = null;
        user.password_reset_expires_at = null;
        await this.userRepo.save(user);

        return { success: true, message: 'Пароль успешно сброшен. Теперь вы можете войти.' };
    }

    async setUserPassword(userId: string, dto: TAdminSetUserPasswordDto) {
        const user = await this.userRepo.findOne({ where: { id: userId } });

        if (!user) {
            throw new BadRequestException('Пользователь не найден');
        }

        user.password_hash = await bcrypt.hash(dto.password, 10);
        user.password_reset_token_hash = null;
        user.password_reset_expires_at = null;
        await this.userRepo.save(user);

        return { success: true, message: 'Пароль успешно установлен' };
    }

    private hashResetToken(token: string): string {
        return createHash('sha256').update(token).digest('hex');
    }

    private generateTokens(userId: string, roleId: string, roleName: string) {
        const jwtSecret = this.config.get<string>('JWT_SECRET')!;
        const jwtRefreshSecret = this.config.get<string>('JWT_REFRESH_SECRET')!;
        const expiresIn = this.config.get<string>('JWT_EXPIRES_IN', '15m');
        const refreshExpiresIn = this.config.get<string>(
            'JWT_REFRESH_EXPIRES_IN',
            '7d',
        );

        const payload = { sub: userId, role: roleId, roleName };

        const access_token = jwt.sign(payload, jwtSecret, {
            expiresIn,
        });

        const refresh_token = jwt.sign(payload, jwtRefreshSecret, {
            expiresIn: refreshExpiresIn,
        });

        return { access_token, refresh_token };
    }

    getCookieOptions() {
        const isProduction = this.config.get('NODE_ENV') === 'production';
        const webUrl = this.config.get('WEB_URL', 'http://localhost:3000');
        const webUrlObj = new URL(webUrl);

        // Don't set domain for localhost or when accessing via IP directly
        const isLocalhost = webUrlObj.hostname === 'localhost' || webUrlObj.hostname === '127.0.0.1';
        const setDomain = isProduction && !isLocalhost;

        return {
            httpOnly: true,
            secure: false, // Allow cookies over HTTP for local network access
            sameSite: 'lax' as const,
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            domain: setDomain ? webUrlObj.hostname : undefined,
        };
    }

    getAccessTokenCookieOptions() {
        const isProduction = this.config.get('NODE_ENV') === 'production';
        const webUrl = this.config.get('WEB_URL', 'http://localhost:3000');
        const webUrlObj = new URL(webUrl);

        // Don't set domain for localhost or when accessing via IP directly
        const isLocalhost = webUrlObj.hostname === 'localhost' || webUrlObj.hostname === '127.0.0.1';
        const setDomain = isProduction && !isLocalhost;

        return {
            httpOnly: true,
            secure: false, // Allow cookies over HTTP for local network access
            sameSite: 'lax' as const,
            path: '/',
            maxAge: 15 * 60 * 1000, // 15 minutes
            domain: setDomain ? webUrlObj.hostname : undefined,
        };
    }

    getSessionMarkerCookieOptions() {
        const webUrl = this.config.get('WEB_URL', 'http://localhost:3000');
        const webUrlObj = new URL(webUrl);
        const isProduction = this.config.get('NODE_ENV') === 'production';

        const isLocalhost = webUrlObj.hostname === 'localhost' || webUrlObj.hostname === '127.0.0.1';
        const setDomain = isProduction && !isLocalhost;

        return {
            httpOnly: false,
            secure: false,
            sameSite: 'lax' as const,
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            domain: setDomain ? webUrlObj.hostname : undefined,
        };
    }

    /**
     * Validate or create user from Google OAuth data
     */
    async validateGoogleUser(data: GoogleUserData) {
        this.logger.log('Validating Google user', { googleId: data.googleId, email: data.email });

        // Try to find user by google_id
        let user = await this.userRepo.findOne({
            where: { google_id: data.googleId },
            relations: ['role'],
        });

        // If not found by google_id, try to find by email and link accounts
        if (!user && data.email) {
            user = await this.userRepo.findOne({
                where: { email: data.email },
                relations: ['role'],
            });

            if (user) {
                // Link Google account to existing user
                user.google_id = data.googleId;
                if (data.avatarUrl && !user.avatar_url) {
                    user.avatar_url = data.avatarUrl;
                }
                await this.userRepo.save(user);
                this.logger.log('Linked Google account to existing user', { userId: user.id });
            }
        }

        // If still no user, create new one
        if (!user) {
            const clientRole = await this.roleRepo.findOne({
                where: { name_eng: 'client' },
            });

            if (!clientRole) {
                this.logger.error('Client role missing during Google OAuth registration');
                throw new Error('Client role not found');
            }

            // Check if email is already used by another user
            if (data.email) {
                const existingUser = await this.userRepo.findOne({
                    where: { email: data.email },
                });
                if (existingUser) {
                    throw new ConflictException('Email already registered with different account');
                }
            }

            user = this.userRepo.create({
                full_name: data.fullName,
                email: data.email || null,
                google_id: data.googleId,
                avatar_url: data.avatarUrl || null,
                role_id: clientRole.id,
                preferred_language: 'ru',
                // No password for OAuth users
                password_hash: null,
            });

            await this.userRepo.save(user);
            this.logger.log('Created new user from Google OAuth', { userId: user.id });

            // Create client record
            const client = this.clientRepo.create({
                user_id: user.id,
                full_name: data.fullName,
                email: data.email || null,
                preferred_language: 'ru',
            });
            await this.clientRepo.save(client);
        }

        const roleName = user.role.name_eng.toLowerCase();
        const tokens = this.generateTokens(user.id, user.role_id, roleName);

        return {
            ...tokens,
            user: {
                id: user.id,
                full_name: user.full_name,
                role: roleName,
                avatar_url: user.avatar_url,
                email: user.email,
            },
        };
    }
}
