import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CertificatesService } from './certificates.service.js';
import { DatabaseService } from '../../database/database.service.js';

describe('CertificatesService', () => {
  let service: CertificatesService;

  const mockEvent = {
    id: '11111111-1111-1111-1111-111111111111',
    title: 'University Hackathon 2026',
    slug: 'university-hackathon-2026',
    organizerId: 'org-user-1',
    startDate: new Date('2026-09-17T09:00:00Z'),
    endDate: new Date('2026-09-17T17:00:00Z'),
    location: 'Campus Tech Hall',
    isOnline: false,
    organizer: {
      name: 'Prof. Davis',
      department: 'Engineering',
    },
  };

  const mockStudentUser = {
    id: 'student-user-1',
    name: 'Jane Doe',
    email: 'jane@uni.edu',
    studentId: 'STU-98765',
    department: 'Software Engineering',
  };

  const mockRegistrationWithAttendance = {
    id: '22222222-2222-2222-2222-222222222222',
    eventId: mockEvent.id,
    userId: mockStudentUser.id,
    registrationCode: 'UNIV-REG123',
    attendance: {
      id: 'att-1',
      scannedAt: new Date(),
    },
    user: mockStudentUser,
  };

  const mockCertificate = {
    id: 'cert-uuid-1',
    eventId: mockEvent.id,
    userId: mockStudentUser.id,
    certificateCode: 'UCERT-A1B2C3-D4E5F6',
    pdfUrl: '/api/certificates/code/UCERT-A1B2C3-D4E5F6/pdf',
    issuedAt: new Date(),
    event: mockEvent,
    user: mockStudentUser,
  };

  const mockDb = {
    query: {
      events: {
        findFirst: jest.fn(),
      },
      registrations: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      certificates: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
    },
    insert: jest.fn(() => ({
      values: jest.fn(() => ({
        returning: jest.fn().mockResolvedValue([mockCertificate]),
      })),
    })),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'FRONTEND_URL') return 'http://localhost:3000';
      return null;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CertificatesService,
        {
          provide: DatabaseService,
          useValue: { db: mockDb },
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<CertificatesService>(CertificatesService);
  });

  describe('generatePdfBuffer', () => {
    it('should generate a valid PDF document buffer with PDF header', async () => {
      const buffer = await service.generatePdfBuffer({
        certificateCode: 'UCERT-TEST-CODE',
        studentName: 'Alice Test',
        studentId: 'STU-11111',
        department: 'Science',
        eventTitle: 'Intro to Quantum Computing',
        eventDate: new Date(),
        organizerName: 'Dr. Smith',
        organizerDepartment: 'Physics',
        issuedAt: new Date(),
        verifyUrl: 'http://localhost:3000/verify/UCERT-TEST-CODE',
      });

      expect(Buffer.isBuffer(buffer)).toBe(true);
      // PDF documents start with '%PDF-'
      expect(buffer.toString('utf8', 0, 5)).toBe('%PDF-');
      expect(buffer.length).toBeGreaterThan(1000);
    });
  });

  describe('issueCertificate', () => {
    it('should successfully issue a certificate for an attended participant', async () => {
      mockDb.query.events.findFirst.mockResolvedValue(mockEvent);
      mockDb.query.certificates.findFirst.mockResolvedValue(null);
      mockDb.query.registrations.findFirst.mockResolvedValue(
        mockRegistrationWithAttendance,
      );

      const result = await service.issueCertificate(
        mockEvent.id,
        mockStudentUser.id,
        { id: 'org-user-1', role: 'organizer' },
      );

      expect(result.certificateCode).toBeDefined();
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should return existing certificate if already issued (idempotency)', async () => {
      mockDb.query.events.findFirst.mockResolvedValue(mockEvent);
      mockDb.query.certificates.findFirst.mockResolvedValue(mockCertificate);

      const result = await service.issueCertificate(
        mockEvent.id,
        mockStudentUser.id,
        { id: 'org-user-1', role: 'organizer' },
      );

      expect(result.certificateCode).toBe(mockCertificate.certificateCode);
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if attendee has no attendance record', async () => {
      mockDb.query.events.findFirst.mockResolvedValue(mockEvent);
      mockDb.query.certificates.findFirst.mockResolvedValue(null);
      mockDb.query.registrations.findFirst.mockResolvedValue({
        ...mockRegistrationWithAttendance,
        attendance: null, // Did not attend
      });

      await expect(
        service.issueCertificate(mockEvent.id, mockStudentUser.id, {
          id: 'org-user-1',
          role: 'organizer',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if issuer is unauthorized organizer', async () => {
      mockDb.query.events.findFirst.mockResolvedValue(mockEvent);

      await expect(
        service.issueCertificate(mockEvent.id, mockStudentUser.id, {
          id: 'unauthorized-user',
          role: 'organizer',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('verifyCertificate', () => {
    it('should return public verification details for a valid certificate code', async () => {
      mockDb.query.certificates.findFirst.mockResolvedValue(mockCertificate);

      const result = await service.verifyCertificate('UCERT-A1B2C3-D4E5F6');

      expect(result.valid).toBe(true);
      expect(result.certificateCode).toBe(mockCertificate.certificateCode);
      expect(result.student.name).toBe(mockStudentUser.name);
      expect(result.event.title).toBe(mockEvent.title);
    });

    it('should throw NotFoundException for invalid certificate code', async () => {
      mockDb.query.certificates.findFirst.mockResolvedValue(null);

      await expect(
        service.verifyCertificate('UCERT-INVALID-CODE'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
