import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, desc, count } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service.js';
import { user } from '../../database/schema/auth.schema.js';
import type { UpdateUserDto, UpdateRoleDto } from './dto/update-user.dto.js';

@Injectable()
export class UsersService {
  constructor(private readonly databaseService: DatabaseService) {}

  private get db() {
    return this.databaseService.db;
  }

  async getProfile(userId: string) {
    const [foundUser] = await this.db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
        role: user.role,
        studentId: user.studentId,
        department: user.department,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!foundUser) {
      throw new NotFoundException('User profile not found');
    }

    return foundUser;
  }

  async updateProfile(userId: string, data: UpdateUserDto) {
    const [updatedUser] = await this.db
      .update(user)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId))
      .returning({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        studentId: user.studentId,
        department: user.department,
        updatedAt: user.updatedAt,
      });

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return updatedUser;
  }

  async listUsers(page = 1, limit = 20) {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safePage = Math.max(page, 1);
    const offset = (safePage - 1) * safeLimit;

    const [totalRecord] = await this.db.select({ value: count() }).from(user);
    const total = totalRecord?.value ?? 0;

    const users = await this.db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        department: user.department,
        createdAt: user.createdAt,
      })
      .from(user)
      .orderBy(desc(user.createdAt))
      .limit(safeLimit)
      .offset(offset);

    return {
      data: users,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  async updateUserRole(userId: string, data: UpdateRoleDto) {
    const [updatedUser] = await this.db
      .update(user)
      .set({
        role: data.role,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId))
      .returning({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        updatedAt: user.updatedAt,
      });

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return updatedUser;
  }
}
