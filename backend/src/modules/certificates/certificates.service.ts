import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq, and, desc, inArray } from 'drizzle-orm';
import crypto from 'node:crypto';
import PDFDocument from 'pdfkit';
import * as QRCode from 'qrcode';
import { DatabaseService } from '../../database/database.service.js';
import { certificates } from '../../database/schema/certificates.schema.js';
import { events } from '../../database/schema/events.schema.js';
import { registrations } from '../../database/schema/registrations.schema.js';
import { attendance } from '../../database/schema/attendance.schema.js';
import type { EnvConfig } from '../../config/env.schema.js';

export interface CertificatePdfData {
  certificateCode: string;
  studentName: string;
  studentId: string | null;
  department: string | null;
  eventTitle: string;
  eventDate: Date;
  organizerName: string;
  organizerDepartment: string | null;
  issuedAt: Date;
  verifyUrl: string;
}

export interface PublicCertificateVerification {
  valid: boolean;
  certificateCode: string;
  issuedAt: Date;
  student: {
    name: string;
    studentId: string | null;
    department: string | null;
  };
  event: {
    id: string;
    title: string;
    slug: string;
    startDate: Date;
    endDate: Date;
    location: string;
    isOnline: boolean;
  };
  organizer: {
    name: string;
    department: string | null;
  };
  downloadUrl: string;
}

@Injectable()
export class CertificatesService {
  private readonly logger = new Logger(CertificatesService.name);
  private readonly frontendUrl: string;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService<EnvConfig, true>,
  ) {
    this.frontendUrl =
      this.configService.get('FRONTEND_URL', { infer: true }) ||
      'http://localhost:3000';
  }

  /**
   * Generates a unique credential certificate code (e.g. UCERT-8F2B1C-E39A01)
   */
  private generateCertificateCode(): string {
    const p1 = crypto.randomBytes(3).toString('hex').toUpperCase();
    const p2 = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `UCERT-${p1}-${p2}`;
  }

  /**
   * Renders a high-resolution, vector PDF certificate with university aesthetics
   */
  async generatePdfBuffer(data: CertificatePdfData): Promise<Buffer> {
    const qrBuffer = await QRCode.toBuffer(data.verifyUrl, {
      width: 110,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });

    return new Promise((resolve, reject) => {
      // Landscape A4 dimensions: 841.89 x 595.28 points
      const doc = new PDFDocument({
        layout: 'landscape',
        size: 'A4',
        margins: { top: 36, bottom: 36, left: 40, right: 40 },
        info: {
          Title: `Certificate - ${data.eventTitle}`,
          Author: 'Univent University Campus Network',
          Subject: `Credential ${data.certificateCode}`,
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      const width = doc.page.width;
      const height = doc.page.height;

      // 1. Background fill
      doc.rect(0, 0, width, height).fill('#fafafa');

      // 2. Decorative Double Borders (Outer Navy, Inner Gold/Primary)
      doc
        .lineWidth(3)
        .strokeColor('#0f172a')
        .rect(20, 20, width - 40, height - 40)
        .stroke();

      doc
        .lineWidth(1)
        .strokeColor('#4f46e5')
        .rect(26, 26, width - 52, height - 52)
        .stroke();

      // Corner flourishes
      const cornerSize = 16;
      doc.lineWidth(2).strokeColor('#4f46e5');
      // Top-Left
      doc.moveTo(26, 26 + cornerSize).lineTo(26 + cornerSize, 26).stroke();
      // Top-Right
      doc.moveTo(width - 26 - cornerSize, 26).lineTo(width - 26, 26 + cornerSize).stroke();
      // Bottom-Left
      doc.moveTo(26, height - 26 - cornerSize).lineTo(26 + cornerSize, height - 26).stroke();
      // Bottom-Right
      doc.moveTo(width - 26 - cornerSize, height - 26).lineTo(width - 26, height - 26 - cornerSize).stroke();

      // 3. Institution Header
      doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .fillColor('#4f46e5')
        .text('UNIVENT UNIVERSITY CAMPUS NETWORK', 0, 50, {
          align: 'center',
          characterSpacing: 2,
        });

      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#64748b')
        .text('OFFICIAL VERIFIED ACADEMIC & EVENT CREDENTIAL', 0, 68, {
          align: 'center',
          characterSpacing: 1.5,
        });

      // 4. Main Certificate Title
      doc
        .font('Helvetica-Bold')
        .fontSize(26)
        .fillColor('#0f172a')
        .text('CERTIFICATE OF PARTICIPATION', 0, 105, {
          align: 'center',
          characterSpacing: 1,
        });

      // 5. Presentation line
      doc
        .font('Helvetica')
        .fontSize(13)
        .fillColor('#475569')
        .text('THIS IS PROUDLY PRESENTED TO', 0, 150, {
          align: 'center',
          characterSpacing: 2,
        });

      // 6. Recipient Name
      doc
        .font('Helvetica-Bold')
        .fontSize(28)
        .fillColor('#1e293b')
        .text(data.studentName, 0, 185, {
          align: 'center',
        });

      // Underline for name
      const textWidth = doc.widthOfString(data.studentName);
      const startX = (width - Math.min(textWidth + 60, 480)) / 2;
      doc
        .lineWidth(1)
        .strokeColor('#cbd5e1')
        .moveTo(startX, 222)
        .lineTo(startX + Math.min(textWidth + 60, 480), 222)
        .stroke();

      // Student ID & Department
      const studentMeta = [
        data.studentId ? `Student ID: ${data.studentId}` : '',
        data.department ? `Department of ${data.department}` : '',
      ]
        .filter(Boolean)
        .join('  •  ');

      if (studentMeta) {
        doc
          .font('Helvetica')
          .fontSize(11)
          .fillColor('#64748b')
          .text(studentMeta, 0, 230, { align: 'center' });
      }

      // 7. Statement of Completion
      doc
        .font('Helvetica')
        .fontSize(13)
        .fillColor('#475569')
        .text(
          'for verified attendance and active participation in the university event',
          0,
          265,
          { align: 'center' },
        );

      // 8. Event Title
      doc
        .font('Helvetica-Bold')
        .fontSize(20)
        .fillColor('#0f172a')
        .text(`"${data.eventTitle}"`, 60, 295, {
          align: 'center',
          width: width - 120,
        });

      // Event Date & Organizer
      const formattedDate = data.eventDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      doc
        .font('Helvetica')
        .fontSize(11)
        .fillColor('#64748b')
        .text(
          `Conducted on ${formattedDate}  •  Organized by ${data.organizerName}${
            data.organizerDepartment ? ` (${data.organizerDepartment})` : ''
          }`,
          0,
          340,
          { align: 'center' },
        );

      // 9. Bottom Footer: Verification QR Code (Left) & Signature Block (Right)
      const bottomY = 415;

      // QR Code on bottom left
      doc.image(qrBuffer, 60, bottomY, { width: 85 });

      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor('#0f172a')
        .text('VERIFY ONLINE', 155, bottomY + 12);

      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor('#64748b')
        .text('Scan QR or visit:', 155, bottomY + 26);

      doc
        .font('Helvetica-Bold')
        .fontSize(8)
        .fillColor('#4f46e5')
        .text(data.certificateCode, 155, bottomY + 38);

      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor('#94a3b8')
        .text(`Issued ${data.issuedAt.toLocaleDateString()}`, 155, bottomY + 52);

      // Signature on bottom right
      const sigX = width - 260;
      doc
        .lineWidth(1)
        .strokeColor('#94a3b8')
        .moveTo(sigX, bottomY + 45)
        .lineTo(sigX + 200, bottomY + 45)
        .stroke();

      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .fillColor('#0f172a')
        .text(data.organizerName, sigX, bottomY + 52, { width: 200, align: 'center' });

      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#64748b')
        .text('Authorized Event Organizer', sigX, bottomY + 66, {
          width: 200,
          align: 'center',
        });

      doc.end();
    });
  }

  /**
   * Issues a certificate for a single verified attendee
   */
  async issueCertificate(
    eventId: string,
    userId: string,
    issuerUser?: { id: string; role: string },
  ) {
    const db = this.databaseService.db;

    // 1. Verify Event
    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId),
      with: {
        organizer: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (
      issuerUser &&
      issuerUser.role !== 'admin' &&
      event.organizerId !== issuerUser.id
    ) {
      throw new ForbiddenException(
        'You are not authorized to issue certificates for this event',
      );
    }

    // 2. Check if certificate already exists (idempotency)
    const existingCert = await db.query.certificates.findFirst({
      where: and(
        eq(certificates.eventId, eventId),
        eq(certificates.userId, userId),
      ),
      with: {
        event: true,
        user: true,
      },
    });

    if (existingCert) {
      return existingCert;
    }

    // 3. Verify attendance: Attendee must have an attendance record
    const registration = await db.query.registrations.findFirst({
      where: and(
        eq(registrations.eventId, eventId),
        eq(registrations.userId, userId),
      ),
      with: {
        attendance: true,
        user: true,
      },
    });

    if (!registration) {
      throw new NotFoundException(
        'Registration not found for this student and event',
      );
    }

    if (!registration.attendance) {
      throw new BadRequestException(
        'Cannot issue certificate: Student has not checked in or attended this event',
      );
    }

    // 4. Generate unique certificate code
    const certificateCode = this.generateCertificateCode();
    const pdfUrl = `/api/certificates/code/${certificateCode}/pdf`;

    // 5. Insert certificate record
    const [newCert] = await db
      .insert(certificates)
      .values({
        eventId: event.id,
        userId: userId,
        certificateCode,
        pdfUrl,
      })
      .returning();

    this.logger.log(
      `Issued certificate [${certificateCode}] for student ${registration.user.name} on event "${event.title}"`,
    );

    return {
      ...newCert,
      event,
      user: registration.user,
    };
  }

  /**
   * Batch issues certificates for all verified attendees of an event
   */
  async batchIssueEventCertificates(
    eventId: string,
    organizerUser: { id: string; role: string },
  ) {
    const db = this.databaseService.db;

    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId),
      with: {
        organizer: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (
      organizerUser.role !== 'admin' &&
      event.organizerId !== organizerUser.id
    ) {
      throw new ForbiddenException(
        'You are not authorized to issue certificates for this event',
      );
    }

    // Find all registrations for this event that have an attendance record
    const attendedRegistrations = await db.query.registrations.findMany({
      where: eq(registrations.eventId, eventId),
      with: {
        attendance: true,
        user: true,
      },
    });

    const eligibleRegistrations = attendedRegistrations.filter(
      (r) => !!r.attendance,
    );

    if (eligibleRegistrations.length === 0) {
      return {
        issuedCount: 0,
        totalEligible: 0,
        message: 'No checked-in attendees found for this event yet',
      };
    }

    // Find existing certificates to avoid duplicates
    const existingCerts = await db.query.certificates.findMany({
      where: eq(certificates.eventId, eventId),
    });
    const issuedUserIds = new Set(existingCerts.map((c) => c.userId));

    const newlyIssued: Array<{
      certificateCode: string;
      userId: string;
      studentName: string;
    }> = [];

    for (const reg of eligibleRegistrations) {
      if (!issuedUserIds.has(reg.userId)) {
        const certificateCode = this.generateCertificateCode();
        const pdfUrl = `/api/certificates/code/${certificateCode}/pdf`;

        await db.insert(certificates).values({
          eventId: event.id,
          userId: reg.userId,
          certificateCode,
          pdfUrl,
        });

        newlyIssued.push({
          certificateCode,
          userId: reg.userId,
          studentName: reg.user.name,
        });
      }
    }

    this.logger.log(
      `Batch issued ${newlyIssued.length} certificates for event "${event.title}"`,
    );

    return {
      issuedCount: newlyIssued.length,
      totalEligible: eligibleRegistrations.length,
      alreadyIssuedCount: existingCerts.length,
      newCertificates: newlyIssued,
    };
  }

  /**
   * Verified attendee claims their certificate
   */
  async claimCertificate(eventId: string, studentUser: { id: string }) {
    return this.issueCertificate(eventId, studentUser.id);
  }

  /**
   * Public verification lookup by credential code (e.g. UCERT-XXXX-XXXX)
   */
  async verifyCertificate(
    certificateCode: string,
  ): Promise<PublicCertificateVerification> {
    const db = this.databaseService.db;

    const cert = await db.query.certificates.findFirst({
      where: eq(
        certificates.certificateCode,
        certificateCode.trim().toUpperCase(),
      ),
      with: {
        event: {
          with: {
            organizer: true,
          },
        },
        user: true,
      },
    });

    if (!cert) {
      throw new NotFoundException(
        'Certificate not found. This credential code is invalid or does not exist.',
      );
    }

    return {
      valid: true,
      certificateCode: cert.certificateCode,
      issuedAt: cert.issuedAt,
      student: {
        name: cert.user.name,
        studentId: cert.user.studentId,
        department: cert.user.department,
      },
      event: {
        id: cert.event.id,
        title: cert.event.title,
        slug: cert.event.slug,
        startDate: cert.event.startDate,
        endDate: cert.event.endDate,
        location: cert.event.location,
        isOnline: cert.event.isOnline,
      },
      organizer: {
        name: cert.event.organizer.name,
        department: cert.event.organizer.department,
      },
      downloadUrl: `/api/certificates/code/${cert.certificateCode}/pdf`,
    };
  }

  /**
   * Retrieves all certificates issued to a student
   */
  async getMyCertificates(userId: string) {
    const db = this.databaseService.db;

    const certs = await db.query.certificates.findMany({
      where: eq(certificates.userId, userId),
      with: {
        event: {
          with: {
            organizer: true,
            category: true,
          },
        },
      },
      orderBy: [desc(certificates.issuedAt)],
    });

    return certs.map((c) => ({
      id: c.id,
      certificateCode: c.certificateCode,
      issuedAt: c.issuedAt,
      pdfUrl: `/api/certificates/code/${c.certificateCode}/pdf`,
      event: {
        id: c.event.id,
        title: c.event.title,
        slug: c.event.slug,
        startDate: c.event.startDate,
        endDate: c.event.endDate,
        location: c.event.location,
        isOnline: c.event.isOnline,
        category: c.event.category?.name || 'Campus Event',
      },
      organizer: {
        name: c.event.organizer.name,
        department: c.event.organizer.department,
      },
    }));
  }

  /**
   * Generates and streams vector PDF for a certificate by code
   */
  async getCertificatePdfStream(
    certificateCode: string,
  ): Promise<{ buffer: Buffer; filename: string }> {
    const db = this.databaseService.db;

    const cert = await db.query.certificates.findFirst({
      where: eq(
        certificates.certificateCode,
        certificateCode.trim().toUpperCase(),
      ),
      with: {
        event: {
          with: {
            organizer: true,
          },
        },
        user: true,
      },
    });

    if (!cert) {
      throw new NotFoundException('Certificate not found');
    }

    const verifyUrl = `${this.frontendUrl}/verify/${cert.certificateCode}`;

    const pdfBuffer = await this.generatePdfBuffer({
      certificateCode: cert.certificateCode,
      studentName: cert.user.name,
      studentId: cert.user.studentId,
      department: cert.user.department,
      eventTitle: cert.event.title,
      eventDate: cert.event.startDate,
      organizerName: cert.event.organizer.name,
      organizerDepartment: cert.event.organizer.department,
      issuedAt: cert.issuedAt,
      verifyUrl,
    });

    const sanitizedTitle = cert.event.title
      .replace(/[^a-zA-Z0-9]/g, '_')
      .slice(0, 30);

    return {
      buffer: pdfBuffer,
      filename: `Certificate_${sanitizedTitle}_${cert.certificateCode}.pdf`,
    };
  }
}
