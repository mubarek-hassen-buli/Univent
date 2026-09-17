import {
  Controller,
  Get,
  Post,
  Param,
  Res,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import type { Response } from 'express';
import { CertificatesService } from './certificates.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@Controller('certificates')
@UseGuards(AuthGuard, RolesGuard)
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  /**
   * Public verification of credential certificate code (e.g. UCERT-XXXX-XXXX)
   */
  @Public()
  @Get('verify/:code')
  async verifyCertificate(@Param('code') code: string) {
    return this.certificatesService.verifyCertificate(code);
  }

  /**
   * Public high-resolution vector PDF certificate download / display stream
   */
  @Public()
  @Get('code/:code/pdf')
  async streamCertificatePdf(
    @Param('code') code: string,
    @Res() res: Response,
  ) {
    const { buffer, filename } =
      await this.certificatesService.getCertificatePdfStream(code);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Content-Length': buffer.length,
      'Cache-Control': 'public, max-age=86400',
    });

    res.end(buffer);
  }

  /**
   * Retrieves all verified certificates issued to the current authenticated student
   */
  @Get('my-certificates')
  async getMyCertificates(@CurrentUser() user: { id: string }) {
    return this.certificatesService.getMyCertificates(user.id);
  }

  /**
   * Allows an attendee to claim/generate their certificate after attending
   */
  @Post('claim/:eventId')
  async claimCertificate(
    @Param('eventId', new ParseUUIDPipe()) eventId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.certificatesService.claimCertificate(eventId, user);
  }

  /**
   * Organizer / Admin batch-issues certificates for all attended participants
   */
  @Post('event/:eventId/issue-all')
  @Roles('organizer', 'admin')
  async batchIssueCertificates(
    @Param('eventId', new ParseUUIDPipe()) eventId: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.certificatesService.batchIssueEventCertificates(eventId, user);
  }

  /**
   * Organizer / Admin issues a certificate for a single verified attendee
   */
  @Post('event/:eventId/user/:userId/issue')
  @Roles('organizer', 'admin')
  async issueSingleCertificate(
    @Param('eventId', new ParseUUIDPipe()) eventId: string,
    @Param('userId') userId: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.certificatesService.issueCertificate(eventId, userId, user);
  }
}
