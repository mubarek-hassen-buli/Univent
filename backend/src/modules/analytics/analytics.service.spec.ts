import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service.js';
import { DatabaseService } from '../../database/database.service.js';

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  const mockDb = {
    query: {
      events: {
        findMany: jest.fn(),
      },
      user: {
        findMany: jest.fn(),
      },
      categories: {
        findMany: jest.fn(),
      },
      certificates: {
        findMany: jest.fn(),
      },
    },
    select: jest.fn(() => {
      const builder: any = {
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        then: (resolve: any) => resolve([{ count: 20, val: 20, date: '2026-09-01' }]),
      };
      return builder;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: DatabaseService,
          useValue: { db: mockDb },
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  describe('getOrganizerAnalytics', () => {
    it('should calculate attendance rates, occupancy and event breakdown', async () => {
      mockDb.query.events.findMany.mockResolvedValue([
        {
          id: 'evt-1',
          title: 'Event 1',
          slug: 'event-1',
          status: 'PUBLISHED',
          startDate: new Date(),
          capacity: 100,
          registeredCount: 80,
          category: { name: 'Tech' },
          attendanceRecords: [{ id: 'att-1' }, { id: 'att-2' }],
        },
      ]);

      const analytics = await service.getOrganizerAnalytics('org-1');

      expect(analytics.totalEvents).toBe(1);
      expect(analytics.totalCapacity).toBe(100);
      expect(analytics.totalRegistrations).toBe(80);
      expect(analytics.totalAttended).toBe(2);
      expect(analytics.overallOccupancyRate).toBe(80);
    });
  });

  describe('getAdminAnalytics', () => {
    it('should aggregate platform-wide user, event, and category statistics', async () => {
      mockDb.query.user.findMany.mockResolvedValue([
        { id: '1', role: 'student' },
        { id: '2', role: 'organizer' },
        { id: '3', role: 'admin' },
      ]);
      mockDb.query.events.findMany.mockResolvedValue([
        {
          id: 'evt-1',
          title: 'Hackathon',
          slug: 'hackathon',
          status: 'PUBLISHED',
          createdAt: new Date(),
          organizer: { name: 'Organizer Dave' },
        },
      ]);
      mockDb.query.categories.findMany.mockResolvedValue([
        { id: 'cat-1', name: 'Workshops', events: [{ id: 'evt-1' }] },
      ]);
      mockDb.query.certificates.findMany.mockResolvedValue([]);

      const adminData = await service.getAdminAnalytics();

      expect(adminData.overview.totalUsers).toBe(3);
      expect(adminData.overview.totalStudents).toBe(1);
      expect(adminData.overview.totalOrganizers).toBe(1);
      expect(adminData.overview.totalAdmins).toBe(1);
      expect(adminData.overview.publishedEvents).toBe(1);
      expect(adminData.categoryDistribution[0].name).toBe('Workshops');
    });
  });
});
