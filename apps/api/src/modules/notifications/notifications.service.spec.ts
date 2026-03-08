import { vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
import { NotificationEntity, OrderEntity, UserEntity } from '../../database/entities';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let notifRepo: any;
  let userRepo: any;
  let orderRepo: any;
  let notifQueue: any;

  beforeEach(async () => {
    notifRepo = {
      create: vi.fn((data) => data),
      save: vi.fn(async (data) => ({ id: data.id || `notif-${Math.random()}`, ...data })),
      findAndCount: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    };
    userRepo = {
      findOne: vi.fn(),
      find: vi.fn(),
    };
    orderRepo = {
      findOne: vi.fn(),
    };
    notifQueue = {
      add: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getRepositoryToken(NotificationEntity), useValue: notifRepo },
        { provide: getRepositoryToken(UserEntity), useValue: userRepo },
        { provide: getRepositoryToken(OrderEntity), useValue: orderRepo },
        { provide: getQueueToken('notifications'), useValue: notifQueue },
        { provide: ConfigService, useValue: { get: vi.fn() } },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    vi.clearAllMocks();
  });

  it('sends only channels enabled in account settings and still creates in-app notification', async () => {
    userRepo.findOne.mockResolvedValue({
      id: 'user-1',
      full_name: 'Test User',
      email: 'test@example.com',
      phone: '+998901234567',
      telegram: '@testuser',
      fcm_token: 'fcm-token',
      account_settings: {
        notifications: {
          email: false,
          sms: true,
          telegram: false,
          push: true,
        },
      },
    });
    orderRepo.findOne.mockResolvedValue({
      id: 'order-1',
      client: { full_name: 'Client Test' },
    });

    const emailSpy = vi.spyOn(service, 'sendEmail').mockResolvedValue({ success: true });
    const smsSpy = vi.spyOn(service, 'sendSMS').mockResolvedValue({ success: true });
    const telegramSpy = vi.spyOn(service, 'sendTelegram').mockResolvedValue({ success: true });
    const pushSpy = vi.spyOn(service, 'sendPush').mockResolvedValue({ success: true });

    await service.sendOrderStatusNotification('order-1', 'user-1', 'approved', 'ru');

    expect(emailSpy).not.toHaveBeenCalled();
    expect(telegramSpy).not.toHaveBeenCalled();
    expect(smsSpy).toHaveBeenCalledTimes(1);
    expect(pushSpy).toHaveBeenCalledTimes(1);
    expect(notifRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      channel: 'in_app',
      template_key: 'status_change',
    }));
  });

  it('uses default notification preferences when account settings are missing', async () => {
    userRepo.findOne.mockResolvedValue({
      id: 'user-2',
      full_name: 'Master User',
      email: 'master@example.com',
      phone: '+998901234568',
      telegram: '@master',
      fcm_token: 'fcm-master',
      account_settings: null,
    });

    const emailSpy = vi.spyOn(service, 'sendEmail').mockResolvedValue({ success: true });
    const smsSpy = vi.spyOn(service, 'sendSMS').mockResolvedValue({ success: true });
    const telegramSpy = vi.spyOn(service, 'sendTelegram').mockResolvedValue({ success: true });
    const pushSpy = vi.spyOn(service, 'sendPush').mockResolvedValue({ success: true });

    await service.sendMasterAssignmentNotification('order-2', 'user-2', 'ru');

    expect(emailSpy).toHaveBeenCalledTimes(1);
    expect(telegramSpy).toHaveBeenCalledTimes(1);
    expect(pushSpy).toHaveBeenCalledTimes(1);
    expect(smsSpy).not.toHaveBeenCalled();
  });

  it('queues generic template notifications across available channels', async () => {
    userRepo.findOne.mockResolvedValue({
      id: 'client-1',
      email: 'client@example.com',
      phone: '+998901234567',
      telegram: '@client',
      fcm_token: 'fcm-token',
      account_settings: {
        notifications: {
          email: true,
          sms: true,
          telegram: true,
          push: true,
        },
      },
    });

    const result = await service.queueTemplateNotificationToUser(
      'client-1',
      'order-1',
      'order_assigned',
      'ru',
      { orderId: 'ORDER1' },
    );

    expect(result.queued).toBe(5);
    expect(notifRepo.save).toHaveBeenCalledTimes(5);
    expect(notifQueue.add).toHaveBeenCalledTimes(4);
  });

  it('skips marketing broadcast for clients who opted out', async () => {
    const recipients = [
      {
        id: 'client-opted-in',
        preferred_language: 'ru',
        role: { name_eng: 'client' },
        email: 'in@example.com',
        account_settings: {
          role_preferences: {
            marketing_notifications: true,
          },
          notifications: {
            email: true,
          },
        },
      },
      {
        id: 'client-opted-out',
        preferred_language: 'ru',
        role: { name_eng: 'client' },
        email: 'out@example.com',
        account_settings: {
          role_preferences: {
            marketing_notifications: false,
          },
          notifications: {
            email: true,
          },
        },
      },
    ];

    userRepo.find.mockResolvedValue(recipients);

    userRepo.findOne.mockImplementation(async ({ where }: any) => {
      if (where.id === 'client-opted-in') {
        return recipients[0];
      }
      if (where.id === 'client-opted-out') {
        return recipients[1];
      }
      return null;
    });

    const result = await service.sendMarketingBroadcast('Promo message', 'ru', ['in_app', 'email']);

    expect(result.recipients).toBe(2);
    expect(result.skipped).toBe(1);
    expect(result.queued).toBe(2);
  });
});
