import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import {
  updateUserSchema,
  updateRoleSchema,
  type UpdateUserDto,
  type UpdateRoleDto,
} from './dto/update-user.dto.js';
import {
  createUserSchema,
  queryUsersSchema,
  type CreateUserDto,
  type QueryUsersDto,
} from './dto/create-user.dto.js';

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMyProfile(@CurrentUser('id') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Patch('me')
  async updateMyProfile(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(updateUserSchema)) body: UpdateUserDto,
  ) {
    return this.usersService.updateProfile(userId, body);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin')
  async listUsers(
    @Query(new ZodValidationPipe(queryUsersSchema)) query: QueryUsersDto,
  ) {
    return this.usersService.listUsers(query);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  async createUser(
    @Body(new ZodValidationPipe(createUserSchema)) body: CreateUserDto,
  ) {
    return this.usersService.createUser(body);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async deleteUser(
    @Param('id') targetUserId: string,
    @CurrentUser('id') currentAdminId: string,
  ) {
    return this.usersService.deleteUser(targetUserId, currentAdminId);
  }

  @Patch(':id/role')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async updateUserRole(
    @Param('id') userId: string,
    @Body(new ZodValidationPipe(updateRoleSchema)) body: UpdateRoleDto,
  ) {
    return this.usersService.updateUserRole(userId, body);
  }

  @Patch(':id/approve')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async approveOrganizer(@Param('id') userId: string) {
    return this.usersService.approveOrganizer(userId);
  }
}
