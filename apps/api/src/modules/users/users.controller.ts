import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    Query,
    UseGuards,
    UsePipes,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { mkdirSync } from 'fs';
import { UsersService } from './users.service';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { getAvatarUploadsDir } from '../../common/utils/uploads-path';
import { CreateUserDto, UpdateUserDto, PaginationDto, ChangeUserRoleDto } from '@hdd-fixer/shared';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    @Roles('admin')
    @ApiOperation({ summary: 'List all users (admin only)' })
    findAll(@Query(new ZodValidationPipe(PaginationDto)) query: any) {
        return this.usersService.findAll(query);
    }

    @Get('masters')
    @Roles('admin', 'operator', 'master', 'client')
    @ApiOperation({ summary: 'List masters for assignment' })
    findMasters() {
        return this.usersService.findMasters();
    }

    @Get('me')
    @ApiOperation({ summary: 'Get current user profile' })
    getMe(@CurrentUser('id') userId: string) {
        return this.usersService.findOne(userId);
    }

    @Get('me/settings')
    @ApiOperation({ summary: 'Get current user account settings' })
    getMySettings(@CurrentUser('id') userId: string) {
        return this.usersService.getMySettings(userId);
    }

    @Patch('me')
    @ApiOperation({ summary: 'Update current user profile' })
    @UsePipes(new ZodValidationPipe(UpdateUserDto))
    updateMe(@CurrentUser('id') userId: string, @Body() dto: any) {
        return this.usersService.update(userId, dto);
    }

    @Patch('me/settings')
    @ApiOperation({ summary: 'Update current user account settings (role-specific)' })
    updateMySettings(@CurrentUser('id') userId: string, @Body() dto: Record<string, unknown>) {
        return this.usersService.updateMySettings(userId, dto);
    }

    @Patch('me/password')
    @ApiOperation({ summary: 'Change current user password' })
    async changePassword(
        @CurrentUser('id') userId: string,
        @Body() dto: { current_password: string; new_password: string },
    ) {
        return this.usersService.changePassword(userId, dto.current_password, dto.new_password);
    }

    @Patch('me/avatar')
    @ApiOperation({ summary: 'Upload current user avatar' })
    @UseInterceptors(
        FileInterceptor('avatar', {
            storage: diskStorage({
                destination: (_req, _file, cb) => {
                    const avatarUploadDir = getAvatarUploadsDir();
                    mkdirSync(avatarUploadDir, { recursive: true });
                    cb(null, avatarUploadDir);
                },
                filename: (_req, file, cb) => {
                    const extension = extname(file.originalname || '').toLowerCase() || '.jpg';
                    cb(null, `${Date.now()}-${randomUUID()}${extension}`);
                },
            }),
            limits: {
                fileSize: 5 * 1024 * 1024,
            },
            fileFilter: (_req, file, cb) => {
                if (!file.mimetype?.startsWith('image/')) {
                    cb(new BadRequestException('Только изображения доступны для аватарки') as any, false);
                    return;
                }
                cb(null, true);
            },
        }),
    )
    async updateMyAvatar(@CurrentUser('id') userId: string, @UploadedFile() file?: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('Файл аватарки обязателен');
        }

        const avatarUrl = `/uploads/avatars/${file.filename}`;
        return this.usersService.updateAvatar(userId, avatarUrl);
    }

    @Get(':id')
    @Roles('admin')
    @ApiOperation({ summary: 'Get user by ID' })
    findOne(@Param('id') id: string) {
        return this.usersService.findOne(id);
    }

    @Post()
    @Roles('admin')
    @ApiOperation({ summary: 'Create a new user' })
    @UsePipes(new ZodValidationPipe(CreateUserDto))
    create(@Body() dto: any, @CurrentUser('id') userId: string) {
        return this.usersService.create(dto, userId);
    }

    @Patch(':id')
    @Roles('admin')
    @ApiOperation({ summary: 'Update user' })
    @UsePipes(new ZodValidationPipe(UpdateUserDto))
    update(@Param('id') id: string, @Body() dto: any) {
        return this.usersService.update(id, dto);
    }

    @Delete(':id')
    @Roles('admin')
    @ApiOperation({ summary: 'Delete user' })
    remove(@Param('id') id: string) {
        return this.usersService.remove(id);
    }

    @Patch(':id/role')
    @Roles('admin')
    @ApiOperation({ summary: 'Change user role (admin only)' })
    @UsePipes(new ZodValidationPipe(ChangeUserRoleDto))
    changeRole(@Param('id') id: string, @Body() dto: any) {
        return this.usersService.changeRole(id, dto);
    }
}
