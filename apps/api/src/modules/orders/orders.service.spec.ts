import { vi } from 'vitest';
const jest = vi;

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import {
  OrderEntity,
  OrderDetailEntity,
  OrderLifecycleEntity,
  OrderPriceHistoryEntity,
  ClientEntity,
  UserEntity,
  NotificationEntity,
} from '../../database/entities';
import { AuditService } from './audit.service';
import { StateMachineService } from './state-machine.service';
import { NotificationsService } from '../notifications/notifications.service';
import { validateTransitionRequirements } from './order-state-machine';
import { BadRequestException } from '@nestjs/common';

describe('OrdersService - Business Logic', () => {
  let service: OrdersService;

  const mockOrderRepo = {
    findOne: vi.fn(),
    save: vi.fn(),
  };
  const mockDetailRepo = {
    find: vi.fn(),
    findOne: vi.fn(),
    save: vi.fn(),
  };
  const mockPriceHistoryRepo = {
    create: vi.fn((data) => data),
    save: vi.fn(),
  };
  const mockLifecycleRepo = {
    create: vi.fn(),
    save: vi.fn(),
  };
  const mockAuditService = { logStatusChange: vi.fn() };
  const mockStateMachine = {};
  const mockNotifications = { sendNotification: vi.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(OrderEntity), useValue: mockOrderRepo },
        { provide: getRepositoryToken(OrderDetailEntity), useValue: mockDetailRepo },
        { provide: getRepositoryToken(OrderLifecycleEntity), useValue: mockLifecycleRepo },
        { provide: getRepositoryToken(OrderPriceHistoryEntity), useValue: mockPriceHistoryRepo },
        { provide: getRepositoryToken(ClientEntity), useValue: {} },
        { provide: getRepositoryToken(UserEntity), useValue: {} },
        { provide: getRepositoryToken(NotificationEntity), useValue: {} },
        { provide: 'BullQueue_notifications', useValue: { add: vi.fn() } }, // inject queue
        { provide: AuditService, useValue: mockAuditService },
        { provide: StateMachineService, useValue: mockStateMachine },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);

    vi.clearAllMocks();

    // Mock out side-effect methods to keep unit tests isolated
    (service as any).notifyClient = vi.fn();
    (service as any).notifyClientStatusChange = vi.fn();
    (service as any).addLifecycle = vi.fn();
    (service as any).auditService = mockAuditService;
    (service as any).stateMachineService = mockStateMachine;
    (service as any).notificationsService = mockNotifications;
  });

  describe('setPrice', () => {
    it('should calculate total precisely based on multiple details', async () => {
      const mockOrder = { id: 'ord-1', status: 'diagnosing', total_price_uzs: 0 };
      mockOrderRepo.findOne.mockResolvedValue(mockOrder);
      mockDetailRepo.findOne.mockImplementation(({ where }: any) => {
        if (where.id === 'det-1') return Promise.resolve({ id: 'det-1', price: 0 });
        if (where.id === 'det-2') return Promise.resolve({ id: 'det-2', price: 0 });
        return null;
      });
      mockDetailRepo.find.mockResolvedValue([
        { id: 'det-1', price: 2000 },
        { id: 'det-2', price: 3000 }
      ]);

      await service.setPrice('ord-1', [
        { detail_id: 'det-1', price: 2000 },
        { detail_id: 'det-2', price: 3000 }
      ], 'user-1');

      // Check that orderRepo.save was called with new total = 5000
      expect(mockOrderRepo.save).toHaveBeenCalledWith(expect.objectContaining({ total_price_uzs: 5000 }));
    });

    it('should allow setting price from assigned and move order to awaiting_approval', async () => {
      const mockOrder = { id: 'ord-1', status: 'assigned', total_price_uzs: 0 };
      mockOrderRepo.findOne.mockResolvedValue(mockOrder);
      mockDetailRepo.findOne.mockImplementation(({ where }: any) => {
        if (where.id === 'det-1') return Promise.resolve({ id: 'det-1', price: 0 });
        return null;
      });
      mockDetailRepo.find.mockResolvedValue([
        { id: 'det-1', price: 150000 },
      ]);

      await service.setPrice('ord-1', [
        { detail_id: 'det-1', price: 150000 },
      ], 'user-1');

      expect(mockOrderRepo.save).toHaveBeenCalledWith(expect.objectContaining({
        status: 'awaiting_approval',
        total_price_uzs: 150000,
      }));
    });
  });

  describe('updatePrice', () => {
    it('should change status back to awaiting_approval if order was already approved', async () => {
      const mockOrder = { id: 'ord-1', status: 'approved', total_price_uzs: 200, price_approved_at: new Date() };
      mockOrderRepo.findOne.mockResolvedValue(mockOrder);
      mockDetailRepo.findOne.mockImplementation(({ where }: any) => {
        if (where.id === 'det-1') return Promise.resolve({ id: 'det-1', price: 200 });
        return null;
      });
      mockDetailRepo.find.mockResolvedValue([
        { id: 'det-1', price: 500 },
      ]);

      await service.updatePrice('ord-1', [
        { detail_id: 'det-1', price: 500 }
      ], 'user-1');

      // Status and approval state should be reverted
      expect(mockOrderRepo.save).toHaveBeenCalledWith(expect.objectContaining({
        status: 'awaiting_approval',
        price_approved_at: null
      }));
    });
  });

  describe('completeDetail', () => {
    it('should block completing detail if price has not been approved', async () => {
      const mockOrder = { id: 'ord-1', status: 'awaiting_approval', price_approved_at: null };
      mockOrderRepo.findOne.mockResolvedValue(mockOrder);

      await expect(service.completeDetail('ord-1', 'det-1', 1, undefined, 'user-1')).rejects.toThrow(BadRequestException);
      await expect(service.completeDetail('ord-1', 'det-1', 1, undefined, 'user-1')).rejects.toThrow('Нельзя завершить работу до одобрения цены клиентом');
    });

    it('should block completing detail if status is not in_repair', async () => {
      const mockOrder = { id: 'ord-1', status: 'approved', price_approved_at: new Date() };
      mockOrderRepo.findOne.mockResolvedValue(mockOrder);

      await expect(service.completeDetail('ord-1', 'det-1', 1, undefined, 'user-1')).rejects.toThrow(BadRequestException);
      await expect(service.completeDetail('ord-1', 'det-1', 1, undefined, 'user-1')).rejects.toThrow('Нельзя завершить работу до начала ремонта');
    });
  });

  describe('State Machine Requirements', () => {
    it('should require full payment for issued state', () => {
      const mockTransition: any = { to: 'issued', requirements: ['Оплата подтверждена'] };

      // Partial payment string fails
      const res1 = validateTransitionRequirements(mockTransition, { total_price_uzs: '1000', total_paid_uzs: '500' });
      expect(res1.valid).toBe(false);
      expect(res1.missingRequirements).toContain('Оплата должна быть подтверждена');

      // Full payment (numeric or string) succeeds
      const res2 = validateTransitionRequirements(mockTransition, { total_price_uzs: '1000', total_paid_uzs: 1000 });
      expect(res2.valid).toBe(true);
    });
  });
});
