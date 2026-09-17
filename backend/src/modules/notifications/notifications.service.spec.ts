import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { NotificationsService } from './notifications.service.js';
import { DatabaseService } from '../../database/database.service.js';
import { PusherService } from '../../common/pusher/pusher.service.js';

describe('NotificationsService', () => {
  let service: NotificationsService;

  const mockNotification = {
    id: 'notif-uuid-1',
    userId: 'user-1',
    title: 'Registration Confirmed',
    message: 'You have reserved a pass for AI Symposium',
    type: 'REGISTRATION',
    read: false,
    link: '/student/tickets',
    createdAt: new Date(),
  };

  const mockDb = {
    insert: jest.fn(() => ({
      values: jest.fn(() => ({
        returning: jest.fn().mockResolvedValue([mockNotification]),
      })),
    })),
    update: jest.fn(() => ({
      set: jest.fn(() => ({
        where: jest.fn(() => ({
          returning: jest.fn().mockResolvedValue([{ ...mockNotification, read: true }]),
        })),
      })),
    })),
    query: {
      notifications: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
      events: {
        findFirst: jest.fn(),
      },
      registrations: {
        findMany: jest.fn(),
      },
    },
  };

  const mockPusherService = {
    trigger: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: DatabaseService,
          useValue: { db: mockDb },
        },
        {
          provide: PusherService,
          useValue: mockPusherService,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  describe('createNotification', () => {
    it('should insert a notification and trigger pusher event to user channel', async () => {
      const result = await service.createNotification({
        userId: 'user-1',
        title: 'Registration Confirmed',
        message: 'You have reserved a pass for AI Symposium',
        type: 'REGISTRATION',
      });

      expect(result.id).toBe('notif-uuid-1');
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockPusherService.trigger).toHaveBeenCalledWith(
        'user-user-1',
        'notification:new',
        expect.any(Object),
      );
    });
  });

  describe('getMyNotifications', () => {
    it('should return user notifications and unread count', async () => {
      mockDb.query.notifications.findMany.mockResolvedValue([
        mockNotification,
        { ...mockNotification, id: 'notif-2', read: true },
      ]);

      const result = await service.getMyNotifications('user-1');

      expect(result.notifications.length).toBe(2);
      expect(result.unreadCount).toBe(1);
    });
  });

  describe('markAsRead', () => {
    it('should mark an unread notification as read', async () => {
      mockDb.query.notifications.findFirst.mockResolvedValue(mockNotification);

      const result = await service.markAsRead('notif-uuid-1', 'user-1');

      expect(result.read).toBe(true);
    });

    it('should throw NotFoundException if notification does not exist or belong to user', async () => {
      mockDb.query.notifications.findFirst.mockResolvedValue(null);

      await expect(
        service.markAsRead('non-existent', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
