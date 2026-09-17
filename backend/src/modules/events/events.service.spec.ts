import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { EventsService } from './events.service.js';
import { DatabaseService } from '../../database/database.service.js';

describe('EventsService', () => {
  let service: EventsService;
  let mockDb: any;

  beforeEach(async () => {
    mockDb = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockResolvedValue([]),
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: DatabaseService,
          useValue: { db: mockDb },
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw NotFoundException if event slug does not exist', async () => {
    mockDb.limit.mockResolvedValueOnce([]);
    await expect(service.getEventBySlug('non-existent-event')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should throw BadRequestException when reducing capacity below registered attendees', async () => {
    const existingEvent = {
      id: 'evt-1',
      organizerId: 'org-1',
      capacity: 50,
      registeredCount: 30,
    };
    jest.spyOn(service, 'getEventById').mockResolvedValueOnce(existingEvent as any);

    await expect(
      service.updateEvent('org-1', 'organizer', 'evt-1', { capacity: 20 }),
    ).rejects.toThrow(BadRequestException);
  });
});
