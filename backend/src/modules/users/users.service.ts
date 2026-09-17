import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Optional,
} from '@nestjs/common';
import { eq, desc, count, or, ilike, and } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service.js';
import { user } from '../../database/schema/auth.schema.js';
import { AuthService } from '../auth/auth.service.js';
import { PusherService } from '../../common/pusher/pusher.service.js';
import type { UpdateUserDto, UpdateRoleDto } from './dto/update-user.dto.js';
import type { CreateUserDto, QueryUsersDto } from './dto/create-user.dto.js';

@Injectable()
export class UsersService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly authService: AuthService,
    @Optional() private readonly pusherService?: PusherService,
  ) {}

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
        phoneNumber: user.phoneNumber,
        isApproved: user.isApproved,
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
        phoneNumber: user.phoneNumber,
        isApproved: user.isApproved,
        studentId: user.studentId,
        department: user.department,
        updatedAt: user.updatedAt,
      });

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return updatedUser;
  }

  async listUsers(query: QueryUsersDto) {
    const safeLimit = Math.min(Math.max(query.limit ?? 20, 1), 100);
    const safePage = Math.max(query.page ?? 1, 1);
    const offset = (safePage - 1) * safeLimit;

    const conditions = [];

    if (query.role) {
      conditions.push(eq(user.role, query.role));
    }

    if (query.isApproved !== undefined) {
      conditions.push(eq(user.isApproved, query.isApproved));
    }

    if (query.search && query.search.trim()) {
      const pattern = `%${query.search.trim()}%`;
      conditions.push(
        or(
          ilike(user.name, pattern),
          ilike(user.email, pattern),
          ilike(user.phoneNumber, pattern),
          ilike(user.studentId, pattern),
          ilike(user.department, pattern),
        ),
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalRecord] = await this.db
      .select({ value: count() })
      .from(user)
      .where(whereClause);
    const total = totalRecord?.value ?? 0;

    const users = await this.db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber,
        isApproved: user.isApproved,
        studentId: user.studentId,
        department: user.department,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(whereClause)
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

  async createUser(dto: CreateUserDto) {
    const existing = await this.db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, dto.email))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException('User with this email already exists');
    }

    const res = await this.authService.auth.api.signUpEmail({
      body: {
        email: dto.email,
        password: dto.password,
        name: dto.name,
        role: dto.role,
        phoneNumber: dto.phoneNumber || '',
        isApproved: dto.isApproved ?? true,
        studentId: dto.studentId || '',
        department: dto.department || '',
      },
    });

    const createdUser = res.user;

    // Ensure isApproved flag is explicitly set if admin specified
    if (dto.isApproved !== undefined) {
      await this.db
        .update(user)
        .set({ isApproved: dto.isApproved, phoneNumber: dto.phoneNumber || null })
        .where(eq(user.id, createdUser.id));
    }

    if (this.pusherService) {
      await this.pusherService.trigger('users', 'user:created', createdUser);
      await this.pusherService.trigger('admin', 'user:created', createdUser);
    }

    return createdUser;
  }

  async approveOrganizer(userId: string) {
    const [target] = await this.db
      .select({ id: user.id, role: user.role, isApproved: user.isApproved })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!target) {
      throw new NotFoundException('User not found');
    }

    const [updatedUser] = await this.db
      .update(user)
      .set({
        isApproved: true,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId))
      .returning({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber,
        isApproved: user.isApproved,
        studentId: user.studentId,
        department: user.department,
        updatedAt: user.updatedAt,
      });

    if (this.pusherService) {
      await this.pusherService.trigger('users', 'user:updated', updatedUser);
      await this.pusherService.trigger('admin', 'user:updated', updatedUser);
      await this.pusherService.trigger(`organizer-${userId}`, 'organizer:approved', updatedUser);
    }

    return updatedUser;
  }

  async deleteUser(userId: string, currentAdminId: string) {
    if (userId === currentAdminId) {
      throw new BadRequestException('You cannot delete your own admin account');
    }

    const [deleted] = await this.db
      .delete(user)
      .where(eq(user.id, userId))
      .returning({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });

    if (!deleted) {
      throw new NotFoundException('User not found');
    }

    if (this.pusherService) {
      await this.pusherService.trigger('users', 'user:deleted', { id: userId });
      await this.pusherService.trigger('admin', 'user:deleted', { id: userId });
    }

    return deleted;
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
        phoneNumber: user.phoneNumber,
        isApproved: user.isApproved,
        updatedAt: user.updatedAt,
      });

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    if (this.pusherService) {
      await this.pusherService.trigger('users', 'user:updated', updatedUser);
      await this.pusherService.trigger('admin', 'user:updated', updatedUser);
    }

    return updatedUser;
  }
}
