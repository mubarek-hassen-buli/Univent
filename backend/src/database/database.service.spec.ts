import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from './database.service.js';
import { DRIZZLE_PROVIDER } from './database.constants.js';

describe('DatabaseService', () => {
  let service: DatabaseService;
  let mockDb: { execute: jest.Mock };

  beforeEach(async () => {
    mockDb = {
      execute: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatabaseService,
        {
          provide: DRIZZLE_PROVIDER,
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<DatabaseService>(DatabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('ping() should execute SELECT 1 and return true', async () => {
    const result = await service.ping();
    expect(result).toBe(true);
    expect(mockDb.execute).toHaveBeenCalledTimes(1);
  });
});
