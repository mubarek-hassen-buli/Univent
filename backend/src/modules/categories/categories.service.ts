import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { eq, asc } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service.js';
import { categories } from '../../database/schema/categories.schema.js';
import type { CreateCategoryDto } from './dto/create-category.dto.js';

@Injectable()
export class CategoriesService {
  constructor(private readonly databaseService: DatabaseService) {}

  private get db() {
    return this.databaseService.db;
  }

  async listCategories() {
    return this.db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        icon: categories.icon,
        createdAt: categories.createdAt,
      })
      .from(categories)
      .orderBy(asc(categories.name));
  }

  async getCategoryBySlug(slug: string) {
    const [category] = await this.db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);

    if (!category) {
      throw new NotFoundException(`Category with slug '${slug}' not found`);
    }

    return category;
  }

  async createCategory(dto: CreateCategoryDto) {
    const slug =
      dto.slug ??
      dto.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

    const [existing] = await this.db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);

    if (existing) {
      throw new ConflictException(`Category with slug '${slug}' already exists`);
    }

    const [created] = await this.db
      .insert(categories)
      .values({
        name: dto.name,
        slug,
        description: dto.description,
        icon: dto.icon,
      })
      .returning();

    return created;
  }
}
