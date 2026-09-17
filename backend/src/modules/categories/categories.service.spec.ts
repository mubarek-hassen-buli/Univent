import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CategoriesService } from './categories.service.js';
import { DatabaseService } from '../../database/database.service.js';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let mockDb: any;

  beforeEach(async () => {
    mockDb = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockResolvedValue([]),
      limit: jest.fn().mockResolvedValue([]),
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: DatabaseService,
          useValue: { db: mockDb },
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return list of categories', async () => {
    const mockCategories = [
      { id: 'cat-1', name: 'Workshops', slug: 'workshops' },
    ];
    mockDb.orderBy.mockResolvedValueOnce(mockCategories);

    const result = await service.listCategories();
    expect(result).toEqual(mockCategories);
  });

  it('should throw NotFoundException if category slug does not exist', async () => {
    mockDb.limit.mockResolvedValueOnce([]);
    await expect(service.getCategoryBySlug('non-existent')).rejects.toThrow(
      NotFoundException,
    );
  });
});
