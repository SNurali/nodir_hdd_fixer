import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { existsSync } from 'fs';
import { unlink } from 'fs/promises';
import { z } from 'zod';
import { UserEntity, RoleEntity, ClientEntity } from '../../database/entities';
import { TCreateUserDto, TUpdateUserDto, TPaginationDto, TChangeUserRoleDto } from '@hdd-fixer/shared';
import { toUploadsFilePath } from '../../common/utils/uploads-path';

type AppRole = 'admin' | 'operator' | 'master' | 'client';

const NotificationSettingsSchema = z.object({
    email: z.boolean().optional(),
    sms: z.boolean().optional(),
    telegram: z.boolean().optional(),
    push: z.boolean().optional(),
});

const UiSettingsSchema = z.object({
    compact_mode: z.boolean().optional(),
    timezone: z.string().min(1).max(64).optional(),
    date_format: z.enum(['dd.mm.yyyy', 'mm/dd/yyyy', 'yyyy-mm-dd']).optional(),
});

const AdminPreferencesSchema = z.object({
    dashboard_period: z.enum(['today', 'week', 'month']).optional(),
    show_finance_widgets: z.boolean().optional(),
    require_status_comment: z.boolean().optional(),
});

const OperatorPreferencesSchema = z.object({
    queue_sort: z.enum(['new_first', 'deadline_first', 'priority_first']).optional(),
    auto_refresh_seconds: z.number().int().min(10).max(300).optional(),
    sound_notifications: z.boolean().optional(),
});

const MasterPreferencesSchema = z.object({
    show_completed_jobs: z.boolean().optional(),
    daily_job_target: z.number().int().min(1).max(100).optional(),
    auto_open_next_assignment: z.boolean().optional(),
});

const ClientPreferencesSchema = z.object({
    marketing_notifications: z.boolean().optional(),
    auto_open_tracking_after_create: z.boolean().optional(),
    show_prices_in_usd: z.boolean().optional(),
});

const UpdateAccountSettingsSchema = z.object({
    preferred_language: z.enum(['ru', 'en', 'uz-cyr', 'uz-lat']).optional(),
    notifications: NotificationSettingsSchema.optional(),
    ui: UiSettingsSchema.optional(),
    role_preferences: z.record(z.unknown()).optional(),
}).strict();

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>,
        @InjectRepository(ClientEntity)
        private readonly clientRepo: Repository<ClientEntity>,
    ) { }

    async findAll(query: TPaginationDto) {
        const { page, limit, search } = query;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (search) {
            where.full_name = ILike(`%${search}%`);
        }

        const [data, total] = await this.userRepo.findAndCount({
            where,
            relations: ['role'],
            skip,
            take: limit,
            order: { created_at: 'DESC' },
        });

        return {
            data: data.map((u) => this.sanitize(u)),
            meta: { total, page, limit },
        };
    }

    async findMasters() {
        const masters = await this.userRepo.find({
            relations: ['role'],
            where: { role: { name_eng: 'master' } },
            order: { full_name: 'ASC' },
        });
        return masters.map((u) => this.sanitize(u));
    }

    async findOne(id: string) {
        const user = await this.userRepo.findOne({
            where: { id },
            relations: ['role'],
        });
        if (!user) throw new NotFoundException('User not found');
        const sanitized = this.sanitize(user) as Record<string, unknown>;
        sanitized.telegram = user.telegram ?? await this.getClientTelegram(user.id);
        return sanitized;
    }

    async create(dto: TCreateUserDto, createdById: string) {
        if (dto.email) {
            const existing = await this.userRepo.findOne({ where: { email: dto.email } });
            if (existing) throw new ConflictException('Email already taken');
        }
        if (dto.phone) {
            const existing = await this.userRepo.findOne({ where: { phone: dto.phone } });
            if (existing) throw new ConflictException('Phone already taken');
        }

        const passwordHash = await bcrypt.hash(dto.password, 10);
        const user = this.userRepo.create({
            full_name: dto.full_name,
            email: dto.email || null,
            phone: dto.phone || null,
            telegram: this.normalizeTelegram(dto.telegram),
            password_hash: passwordHash,
            role_id: dto.role_id,
            preferred_language: dto.preferred_language || 'ru',
            account_settings: {},
            created_by: createdById,
        });
        const saved = await this.userRepo.save(user);
        const role = await this.userRepo.manager.getRepository(RoleEntity).findOne({ where: { id: dto.role_id } });
        if (role) {
            saved.role = role;
            await this.syncClientProfile(saved);
        }
        return this.findOne(saved.id);
    }

    async update(id: string, dto: TUpdateUserDto) {
        const user = await this.userRepo.findOne({ where: { id }, relations: ['role'] });
        if (!user) throw new NotFoundException('User not found');

        const { telegram, ...userFields } = dto as TUpdateUserDto & { telegram?: string };
        Object.assign(user, userFields);
        if (telegram !== undefined) {
            user.telegram = this.normalizeTelegram(telegram);
        }
        await this.userRepo.save(user);
        await this.syncClientProfile(user);
        return this.findOne(id);
    }

    async remove(id: string) {
        const user = await this.userRepo.findOne({ where: { id } });
        if (!user) throw new NotFoundException('User not found');
        await this.userRepo.remove(user);
        return { deleted: true };
    }

    async changeRole(id: string, dto: TChangeUserRoleDto) {
        const user = await this.userRepo.findOne({ where: { id } });
        if (!user) throw new NotFoundException('User not found');

        const role = await this.userRepo.manager.getRepository(RoleEntity).findOne({ where: { id: dto.role_id } });
        if (!role) throw new NotFoundException('Role not found');

        user.role_id = dto.role_id;
        await this.userRepo.save(user);
        return this.findOne(id);
    }

    private sanitize(user: UserEntity) {
        const { password_hash, ...rest } = user as any;
        return rest;
    }

    async changePassword(userId: string, currentPassword: string, newPassword: string) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        const isValid = user.password_hash ? await bcrypt.compare(currentPassword, user.password_hash) : false;
        if (!isValid) {
            throw new ConflictException('Неверный текущий пароль');
        }

        user.password_hash = await bcrypt.hash(newPassword, 10);
        await this.userRepo.save(user);
        return { success: true, message: 'Пароль успешно изменён' };
    }

    async updateAvatar(userId: string, avatarUrl: string) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        const oldAvatarPath = this.toAvatarFilePath(user.avatar_url);
        user.avatar_url = avatarUrl;
        await this.userRepo.save(user);

        if (oldAvatarPath && existsSync(oldAvatarPath)) {
            try {
                await unlink(oldAvatarPath);
            } catch {
                // Ignore file cleanup errors: db update already succeeded.
            }
        }

        return this.findOne(userId);
    }

    async getMySettings(userId: string) {
        const user = await this.userRepo.findOne({
            where: { id: userId },
            relations: ['role'],
        });
        if (!user) throw new NotFoundException('User not found');

        const role = this.getRoleName(user);
        return {
            role,
            settings: this.buildAccountSettings(user, role),
        };
    }

    async updateMySettings(userId: string, payload: unknown) {
        const user = await this.userRepo.findOne({
            where: { id: userId },
            relations: ['role'],
        });
        if (!user) throw new NotFoundException('User not found');

        const parsed = UpdateAccountSettingsSchema.safeParse(payload);
        if (!parsed.success) {
            throw new BadRequestException({
                message: 'Invalid account settings payload',
                errors: parsed.error.flatten(),
            });
        }

        const role = this.getRoleName(user);
        const currentSettings = this.buildAccountSettings(user, role);
        const merged = {
            ...currentSettings,
            ...parsed.data,
            notifications: {
                ...currentSettings.notifications,
                ...(parsed.data.notifications || {}),
            },
            ui: {
                ...currentSettings.ui,
                ...(parsed.data.ui || {}),
            },
            role_preferences: {
                ...currentSettings.role_preferences,
                ...(parsed.data.role_preferences || {}),
            },
        };

        const roleValidation = this.getRolePreferencesSchema(role).safeParse(merged.role_preferences);
        if (!roleValidation.success) {
            throw new BadRequestException({
                message: `Invalid role settings for "${role}"`,
                errors: roleValidation.error.flatten(),
            });
        }

        user.preferred_language = merged.preferred_language || user.preferred_language || 'ru';
        user.account_settings = {
            notifications: merged.notifications,
            ui: merged.ui,
            role_preferences: roleValidation.data,
        };
        await this.userRepo.save(user);
        await this.syncClientProfile(user, role);

        return {
            role,
            settings: this.buildAccountSettings(user, role),
        };
    }

    private getRoleName(user: UserEntity): AppRole {
        const role = (user.role?.name_eng || '').toLowerCase();
        if (role === 'admin' || role === 'operator' || role === 'master' || role === 'client') {
            return role;
        }
        throw new BadRequestException(`Unsupported role for account settings: ${role || 'unknown'}`);
    }

    private getRolePreferencesSchema(role: AppRole) {
        switch (role) {
            case 'admin':
                return AdminPreferencesSchema;
            case 'operator':
                return OperatorPreferencesSchema;
            case 'master':
                return MasterPreferencesSchema;
            case 'client':
                return ClientPreferencesSchema;
        }
    }

    private getDefaultRolePreferences(role: AppRole): Record<string, unknown> {
        switch (role) {
            case 'admin':
                return {
                    dashboard_period: 'week',
                    show_finance_widgets: true,
                    require_status_comment: false,
                };
            case 'operator':
                return {
                    queue_sort: 'new_first',
                    auto_refresh_seconds: 60,
                    sound_notifications: true,
                };
            case 'master':
                return {
                    show_completed_jobs: false,
                    daily_job_target: 5,
                    auto_open_next_assignment: true,
                };
            case 'client':
                return {
                    marketing_notifications: false,
                    auto_open_tracking_after_create: true,
                    show_prices_in_usd: false,
                };
        }
    }

    private buildAccountSettings(user: UserEntity, role: AppRole) {
        const raw = this.toRecord(user.account_settings);
        const notificationsRaw = this.toRecord(raw.notifications);
        const uiRaw = this.toRecord(raw.ui);
        const roleRaw = this.toRecord(raw.role_preferences);

        const notifications = {
            email: true,
            sms: false,
            telegram: true,
            push: true,
            ...notificationsRaw,
        };
        const ui = {
            compact_mode: false,
            timezone: 'Asia/Tashkent',
            date_format: 'dd.mm.yyyy',
            ...uiRaw,
        };
        const roleDefaults = this.getDefaultRolePreferences(role);
        const role_preferences = {
            ...roleDefaults,
            ...roleRaw,
        };

        return {
            preferred_language: user.preferred_language || 'ru',
            notifications,
            ui,
            role_preferences,
        };
    }

    private toRecord(value: unknown): Record<string, unknown> {
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            return {};
        }
        return value as Record<string, unknown>;
    }

    private toAvatarFilePath(avatarUrl: string | null | undefined): string | null {
        if (!avatarUrl || !avatarUrl.startsWith('/uploads/avatars/')) {
            return null;
        }
        return toUploadsFilePath(avatarUrl);
    }

    private async getClientTelegram(userId: string): Promise<string | null> {
        const client = await this.clientRepo.findOne({ where: { user_id: userId } });
        return client?.telegram || null;
    }

    private async syncClientProfile(user: UserEntity, roleOverride?: AppRole): Promise<void> {
        const client = await this.clientRepo.findOne({ where: { user_id: user.id } });
        const role = roleOverride || this.getRoleName(user);

        if (!client && role !== 'client') {
            return;
        }

        if (!client) {
            if (!user.phone) {
                return;
            }
            await this.clientRepo.save(
                this.clientRepo.create({
                    user_id: user.id,
                    full_name: user.full_name,
                    phone: user.phone,
                    email: user.email,
                    preferred_language: user.preferred_language || 'ru',
                    telegram: user.telegram || null,
                }),
            );
            return;
        }

        client.full_name = user.full_name;
        if (user.phone) {
            client.phone = user.phone;
        }
        client.email = user.email;
        client.preferred_language = user.preferred_language || client.preferred_language;
        client.telegram = user.telegram || null;
        await this.clientRepo.save(client);
    }

    private normalizeTelegram(value: string | undefined): string | null {
        const trimmed = (value || '').trim();
        return trimmed ? trimmed : null;
    }
}
