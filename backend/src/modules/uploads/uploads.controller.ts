import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { UploadsService } from './uploads.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';

@Controller('uploads')
@UseGuards(AuthGuard)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('signature')
  getUploadSignature(@Body('folder') folder?: string) {
    return this.uploadsService.getSignedUploadParams(folder || 'univent/events');
  }
}
