import 'reflect-metadata';
import { vi } from 'vitest';
const jest = vi;

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

vi.mock('bcrypt', () => ({
    compare: vi.fn(),
    hash: vi.fn(),
}));

import { AuthService } from './auth.service';
import { UserEntity, ClientEntity, RoleEntity } from '../../database/entities';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';

describe('AuthService', () => {
    let service: AuthService;
    let _userRepo: Repository<UserEntity>;
    let _clientRepo: Repository<ClientEntity>;
    let _roleRepo: Repository<RoleEntity>;

    const mockUser = {
        id: 'test-user-id',
        full_name: 'Test User',
        phone: '+998901234567',
        email: 'test@example.com',
        password_hash: 'hashed-password',
        role_id: 'role-id',
        preferred_language: 'ru',
        role: {
            id: 'role-id',
            name_rus: 'Клиент',
            name_eng: 'client',
        },
    } as UserEntity;

    const mockRole = {
        id: 'role-id',
        name_rus: 'Клиент',
        name_eng: 'client',
    } as RoleEntity;

    const mockUserRepo = {
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
    };

    const mockClientRepo = {
        create: jest.fn(),
        save: jest.fn(),
    };

    const mockRoleRepo = {
        findOne: jest.fn(),
    };

    const mockConfigService = {
        get: jest.fn((key: string, defaultValue?: any) => {
            const config: Record<string, any> = {
                JWT_SECRET: 'test-secret',
                JWT_REFRESH_SECRET: 'test-refresh-secret',
                JWT_EXPIRES_IN: '15m',
                JWT_REFRESH_EXPIRES_IN: '7d',
                NODE_ENV: 'test',
                WEB_URL: 'http://localhost:3000',
            };
            return config[key] || defaultValue;
        }),
    };

    const mockNotificationsService = {
        sendEmail: jest.fn().mockResolvedValue({ success: true }),
        sendSMS: jest.fn().mockResolvedValue({ success: true }),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: getRepositoryToken(UserEntity),
                    useValue: mockUserRepo,
                },
                {
                    provide: getRepositoryToken(ClientEntity),
                    useValue: mockClientRepo,
                },
                {
                    provide: getRepositoryToken(RoleEntity),
                    useValue: mockRoleRepo,
                },
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
                {
                    provide: NotificationsService,
                    useValue: mockNotificationsService,
                },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        _userRepo = module.get<Repository<UserEntity>>(getRepositoryToken(UserEntity));
        _clientRepo = module.get<Repository<ClientEntity>>(getRepositoryToken(ClientEntity));
        _roleRepo = module.get<Repository<RoleEntity>>(getRepositoryToken(RoleEntity));

        (bcrypt.compare as any).mockResolvedValue(true);
        (bcrypt.hash as any).mockResolvedValue('new-hash');
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('login', () => {
        it('should return tokens on successful login', async () => {
            mockUserRepo.findOne.mockResolvedValue(mockUser);

            const result = await service.login({ login: 'test@example.com', password: 'password123' });

            expect(result).toHaveProperty('access_token');
            expect(result).toHaveProperty('refresh_token');
            expect(result.user).toEqual({
                id: mockUser.id,
                full_name: mockUser.full_name,
                role: 'client',
            });
        });

        it('should throw UnauthorizedException when user not found', async () => {
            mockUserRepo.findOne.mockResolvedValue(null);

            await expect(
                service.login({ login: 'nonexistent@example.com', password: 'password' })
            ).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException when password is invalid', async () => {
            mockUserRepo.findOne.mockResolvedValue(mockUser);
            (bcrypt.compare as any).mockResolvedValue(false);

            await expect(
                service.login({ login: 'test@example.com', password: 'wrong-password' })
            ).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('register', () => {
        it('should register a new user successfully', async () => {
            mockRoleRepo.findOne.mockResolvedValue(mockRole);
            mockUserRepo.findOne.mockResolvedValue(null);
            mockUserRepo.create.mockReturnValue(mockUser);
            mockUserRepo.save.mockResolvedValue(mockUser);
            mockClientRepo.create.mockReturnValue({ user_id: mockUser.id });
            mockClientRepo.save.mockResolvedValue({ id: 'client-id' });

            const dto = {
                full_name: 'New User',
                phone: '+998901234567',
                email: 'new@example.com',
                password: 'password123',
                preferred_language: 'ru',
            };

            const result = await service.register(dto);

            expect(result).toHaveProperty('access_token');
            expect(result).toHaveProperty('refresh_token');
            expect(result.user.role).toBe('client');
        });

        it('should throw ConflictException when user already exists', async () => {
            mockRoleRepo.findOne.mockResolvedValue(mockRole);
            mockUserRepo.findOne.mockResolvedValue(mockUser);

            const dto = {
                full_name: 'Existing User',
                phone: '+998901234567',
                password: 'password123',
            };

            await expect(service.register(dto)).rejects.toThrow(ConflictException);
        });
    });

    describe('getCookieOptions', () => {
        it('should return correct cookie options for development', () => {
            const options = service.getCookieOptions();

            expect(options.httpOnly).toBe(true);
            expect(options.secure).toBe(false);
            expect(options.sameSite).toBe('lax');
            expect(options.path).toBe('/');
        });
    });

    describe('forgotPassword', () => {
        it('should return generic success when user does not exist', async () => {
            mockUserRepo.findOne.mockResolvedValue(null);

            const result = await service.forgotPassword('missing@example.com');
            expect(result).toEqual({
                success: true,
                message: 'If the account exists, reset instructions have been sent.',
            });
        });
    });

    describe('resetPassword', () => {
        it('should reset password for valid token', async () => {
            const userWithToken = {
                ...mockUser,
                password_reset_token_hash: 'token-hash',
                password_reset_expires_at: new Date(Date.now() + 60_000),
            };
            mockUserRepo.findOne.mockResolvedValue(userWithToken);
            mockUserRepo.save.mockResolvedValue(userWithToken);

            const result = await service.resetPassword('test-token', 'newPassword123');

            expect(result).toEqual({
                success: true,
                message: 'Пароль успешно сброшен. Теперь вы можете войти.',
            });
            expect(bcrypt.hash).toHaveBeenCalledWith('newPassword123', 10);
        });

        it('should throw for invalid token', async () => {
            mockUserRepo.findOne.mockResolvedValue(null);

            await expect(service.resetPassword('bad-token', 'newPassword123')).rejects.toThrow(
                UnauthorizedException,
            );
        });
    });
});
