import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { CategoriesService } from './categories.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import {
  createCategorySchema,
  type CreateCategoryDto,
} from './dto/create-category.dto.js';

@Controller('categories')
@UseGuards(AuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @Public()
  async listCategories() {
    return this.categoriesService.listCategories();
  }

  @Get(':slug')
  @Public()
  async getCategoryBySlug(@Param('slug') slug: string) {
    return this.categoriesService.getCategoryBySlug(slug);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @UsePipes(new ZodValidationPipe(createCategorySchema))
  async createCategory(@Body() body: CreateCategoryDto) {
    return this.categoriesService.createCategory(body);
  }
}
