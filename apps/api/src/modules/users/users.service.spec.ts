import { vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UserEntity, ClientEntity } from '../../database/entities';
import { ConflictException, NotFoundException } from '@nestjs/common';

vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn(() => Promise.resolve('hashed_password')),
    compare: vi.fn(() => Promise.resolve(true)),
  },
  hash: vi.fn(() => Promise.resolve('hashed_password')),
  compare: vi.fn(() => Promise.resolve(true)),
}));

describe('UsersService', () => {
  let service: UsersService;
  let mockUserRepo: any;
  let mockClientRepo: any;

  beforeEach(async () => {
    mockUserRepo = {
      find: vi.fn(),
      findOne: vi.fn(),
      findAndCount: vi.fn(),
      create: vi.fn((data) => ({ id: 'new-id', ...data })),
      save: vi.fn((entity) => Promise.resolve({ ...entity, id: entity.id || '1' })),
      delete: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      manager: {
        getRepository: vi.fn().mockReturnValue({
          findOne: vi.fn(),
        }),
      },
    };

    mockClientRepo = {
      findOne: vi.fn(),
      create: vi.fn((data) => data),
      save: vi.fn((entity) => Promise.resolve(entity)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(UserEntity), useValue: mockUserRepo },
        { provide: getRepositoryToken(ClientEntity), useValue: mockClientRepo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const mockUsers = [
        { id: '1', full_name: 'John Doe', email: 'john@test.com', role: { name_eng: 'admin' } },
        { id: '2', full_name: 'Jane Doe', email: 'jane@test.com', role: { name_eng: 'master' } },
      ];

      mockUserRepo.findAndCount.mockResolvedValue([mockUsers, 2]);

      const result = await service.findAll({ page: 1, limit: 10, search: '' });

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
    });

    it('should filter users by search query', async () => {
      mockUserRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ page: 1, limit: 10, search: 'John' });

      expect(mockUserRepo.findAndCount).toHaveBeenCalled();
    });
  });

  describe('findMasters', () => {
    it('should return all masters', async () => {
      const mockMasters = [
        { id: '1', full_name: 'Master One', role: { name_eng: 'master' } },
        { id: '2', full_name: 'Master Two', role: { name_eng: 'master' } },
      ];

      mockUserRepo.find.mockResolvedValue(mockMasters);

      const result = await service.findMasters();

      expect(result).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const mockUser = { id: '1', full_name: 'John', role: { name_eng: 'admin' }, password_hash: 'hash' };
      mockUserRepo.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne('1');

      expect(result.full_name).toBe('John');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createDto = {
        email: 'new@test.com',
        password: 'password123',
        full_name: 'New User',
        phone: '+998901234567',
        role_id: 'role-1',
        preferred_language: 'ru' as const,
      };

      const savedUser = { 
        id: 'new-id', 
        ...createDto, 
        role: { name_eng: 'admin' }, 
        password_hash: 'hashed' 
      };

      // First call: email check - return null (no existing user)
      // Second call: phone check - return null (no existing user)  
      // Third call: after save, get the created user
      mockUserRepo.findOne
        .mockResolvedValueOnce(null)  // email check
        .mockResolvedValueOnce(null)  // phone check
        .mockResolvedValueOnce(savedUser); // get created user
      mockUserRepo.manager.getRepository.mockReturnValue({
        findOne: vi.fn().mockResolvedValue({ id: 'role-1', name_eng: 'admin' }),
      });

      mockUserRepo.save.mockResolvedValue(savedUser);

      const result = await service.create(createDto, 'creator-id');

      expect(result).toBeDefined();
    });

    it('should throw ConflictException if email exists', async () => {
      const createDto = {
        email: 'existing@test.com',
        password: 'password123',
        full_name: 'New User',
        phone: '+998901234567',
        role_id: 'role-1',
        preferred_language: 'ru' as const,
      };

      mockUserRepo.findOne.mockResolvedValue({ id: '1', email: 'existing@test.com' });

      await expect(service.create(createDto, 'creator-id')).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updateDto = { full_name: 'Updated Name' };
      const mockUser = { id: '1', full_name: 'Old Name', role: { name_eng: 'admin' }, password_hash: 'hash' };

      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockUserRepo.save.mockResolvedValue({ ...mockUser, ...updateDto });

      const result = await service.update('1', updateDto);

      expect(result.full_name).toBe('Updated Name');
    });

    it('should persist telegram on user without creating a client record for admin', async () => {
      const updateDto = { telegram: '@sysadmin' };
      const mockUser = {
        id: '1',
        full_name: 'Admin',
        phone: '+998901234567',
        role: { name_eng: 'admin' },
        password_hash: 'hash',
        telegram: null,
      };

      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockClientRepo.findOne.mockResolvedValue(null);

      await service.update('1', updateDto);

      expect(mockUserRepo.save).toHaveBeenCalledWith(expect.objectContaining({ telegram: '@sysadmin' }));
      expect(mockClientRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a user', async () => {
      mockUserRepo.findOne.mockResolvedValue({ id: '1' });
      mockUserRepo.remove.mockResolvedValue({ affected: 1 });

      await service.remove('1');

      expect(mockUserRepo.remove).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(service.remove('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('changePassword', () => {
    it('should change user password', async () => {
      const mockUser = { id: '1', password_hash: 'old_hashed_password' };
      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockUserRepo.save.mockResolvedValue(mockUser);

      const result = await service.changePassword('1', 'oldPassword', 'newPassword');

      expect(result.success).toBe(true);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(service.changePassword('999', 'oldPassword', 'newPassword')).rejects.toThrow(NotFoundException);
    });
  });

  describe('changeRole', () => {
    it('should change user role', async () => {
      const mockUser = { id: '1', role_id: 'old-role', role: { name_eng: 'admin' }, password_hash: 'hash' };
      const mockRole = { id: 'new-role', name_eng: 'master' };

      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockUserRepo.manager.getRepository.mockReturnValue({
        findOne: vi.fn().mockResolvedValue(mockRole),
      });
      mockUserRepo.save.mockImplementation(async (entity: any) => {
        entity.role = mockRole;
        return entity;
      });

      await service.changeRole('1', { role_id: 'new-role' });

      expect(mockUserRepo.save).toHaveBeenCalled();
    });
  });

  describe('getMySettings', () => {
    it('should return user settings', async () => {
      const mockUser = {
        id: '1',
        role: { name_eng: 'admin' },
        account_settings: {},
      };

      mockUserRepo.findOne.mockResolvedValue(mockUser);

      const result = await service.getMySettings('1');

      expect(result.role).toBe('admin');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(service.getMySettings('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateMySettings', () => {
    it('should sync preferred_language to existing client profile', async () => {
      const mockUser = {
        id: '1',
        full_name: 'Client User',
        phone: '+998901234567',
        email: 'client@test.com',
        telegram: '@client',
        preferred_language: 'ru',
        role: { name_eng: 'client' },
        account_settings: {},
      };
      const mockClient = {
        user_id: '1',
        full_name: 'Client User',
        phone: '+998901234567',
        email: 'client@test.com',
        telegram: '@client',
        preferred_language: 'ru',
      };

      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockClientRepo.findOne.mockResolvedValue(mockClient);

      await service.updateMySettings('1', { preferred_language: 'uz-lat' });

      expect(mockUserRepo.save).toHaveBeenCalledWith(expect.objectContaining({ preferred_language: 'uz-lat' }));
      expect(mockClientRepo.save).toHaveBeenCalledWith(expect.objectContaining({ preferred_language: 'uz-lat' }));
    });
  });

  describe('updateAvatar', () => {
    it('should update user avatar', async () => {
      const mockUser = { id: '1', avatar_url: null, password_hash: 'hash', role: { name_eng: 'admin' } };
      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockUserRepo.save.mockResolvedValue({ ...mockUser, avatar_url: '/uploads/avatar.jpg' });

      await service.updateAvatar('1', '/uploads/avatar.jpg');

      expect(mockUserRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(service.updateAvatar('999', '/uploads/avatar.jpg')).rejects.toThrow(NotFoundException);
    });
  });
});
