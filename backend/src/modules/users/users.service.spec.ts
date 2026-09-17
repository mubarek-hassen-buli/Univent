import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { DatabaseService } from '../../database/database.service.js';

describe('UsersService', () => {
  let service: UsersService;
  let mockDb: any;

  beforeEach(async () => {
    mockDb = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([]),
      orderBy: jest.fn().mockReturnThis(),
      offset: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: DatabaseService,
          useValue: { db: mockDb },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw NotFoundException if profile does not exist', async () => {
    mockDb.limit.mockResolvedValueOnce([]);
    await expect(service.getProfile('non-existent-id')).rejects.toThrow(NotFoundException);
  });

  it('should return user profile if found', async () => {
    const mockUser = {
      id: 'usr-1',
      name: 'Test Student',
      email: 'student@univent.edu',
      role: 'student',
    };
    mockDb.limit.mockResolvedValueOnce([mockUser]);

    const result = await service.getProfile('usr-1');
    expect(result).toEqual(mockUser);
  });
});
