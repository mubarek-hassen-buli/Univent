import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service.js';
import { DatabaseService } from '../../database/database.service.js';
import { PusherService } from '../../common/pusher/pusher.service.js';
import { RegistrationsService } from '../registrations/registrations.service.js';

describe('AttendanceService', () => {
  let service: AttendanceService;

  const mockEvent = {
    id: '11111111-1111-1111-1111-111111111111',
    title: 'University AI Symposium',
    organizerId: 'org-user-1',
    status: 'PUBLISHED',
    capacity: 100,
    registeredCount: 50,
  };

  const mockStudentUser = {
    id: 'student-user-1',
    name: 'Alice Student',
    email: 'alice@uni.edu',
    studentId: 'STU-12345',
    department: 'Computer Science',
  };

  const mockRegistration = {
    id: '22222222-2222-2222-2222-222222222222',
    eventId: mockEvent.id,
    userId: mockStudentUser.id,
    registrationCode: 'UNIV-A1B2C3D4',
    status: 'CONFIRMED',
    user: mockStudentUser,
    attendance: null as null | { id: string; scannedAt: Date },
  };

  const mockNewAttendance = {
    id: '33333333-3333-3333-3333-333333333333',
    registrationId: mockRegistration.id,
    eventId: mockEvent.id,
    scannedBy: 'org-user-1',
    scannedAt: new Date(),
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
      attendance: {
        findMany: jest.fn(),
      },
    },
    insert: jest.fn(() => ({
      values: jest.fn(() => ({
        returning: jest.fn().mockResolvedValue([mockNewAttendance]),
      })),
    })),
    select: jest.fn(() => ({
      from: jest.fn(() => ({
        where: jest.fn().mockResolvedValue([{ val: 1 }]),
      })),
    })),
  };

  const mockRegistrationsService = {
    verifyQrHash: jest.fn(),
  };

  const mockPusherService = {
    trigger: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        {
          provide: DatabaseService,
          useValue: { db: mockDb },
        },
        {
          provide: RegistrationsService,
          useValue: mockRegistrationsService,
        },
        {
          provide: PusherService,
          useValue: mockPusherService,
        },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
  });

  describe('scanAndCheckIn', () => {
    it('should successfully check in a student using a valid QR hash', async () => {
      mockDb.query.events.findFirst.mockResolvedValue(mockEvent);
      mockRegistrationsService.verifyQrHash.mockReturnValue({
        valid: true,
        registrationId: mockRegistration.id,
        eventId: mockEvent.id,
        userId: mockStudentUser.id,
      });
      mockDb.query.registrations.findFirst.mockResolvedValue({
        ...mockRegistration,
        attendance: null,
      });

      const result = await service.scanAndCheckIn(
        {
          eventId: mockEvent.id,
          qrHash: 'valid:qr:hash:payload:sig',
        },
        { id: 'org-user-1', role: 'organizer' },
      );

      expect(result.attendance.id).toBe(mockNewAttendance.id);
      expect(result.student.name).toBe('Alice Student');
      expect(result.stats.checkedInCount).toBe(1);
      expect(mockPusherService.trigger).toHaveBeenCalledWith(
        `event-${mockEvent.id}`,
        'attendance:checked-in',
        expect.any(Object),
      );
    });

    it('should successfully check in a student using a manual registration code', async () => {
      mockDb.query.events.findFirst.mockResolvedValue(mockEvent);
      mockDb.query.registrations.findFirst.mockResolvedValue({
        ...mockRegistration,
        attendance: null,
      });

      const result = await service.scanAndCheckIn(
        {
          eventId: mockEvent.id,
          registrationCode: 'UNIV-A1B2C3D4',
        },
        { id: 'org-user-1', role: 'organizer' },
      );

      expect(result.attendance.registrationCode).toBe('UNIV-A1B2C3D4');
      expect(result.student.name).toBe('Alice Student');
    });

    it('should throw ForbiddenException if scanner is not event organizer and not admin', async () => {
      mockDb.query.events.findFirst.mockResolvedValue(mockEvent);

      await expect(
        service.scanAndCheckIn(
          {
            eventId: mockEvent.id,
            registrationCode: 'UNIV-A1B2C3D4',
          },
          { id: 'random-other-user', role: 'organizer' },
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException for invalid or counterfeit QR hash signature', async () => {
      mockDb.query.events.findFirst.mockResolvedValue(mockEvent);
      mockRegistrationsService.verifyQrHash.mockReturnValue({ valid: false });

      await expect(
        service.scanAndCheckIn(
          {
            eventId: mockEvent.id,
            qrHash: 'forged:qr:token',
          },
          { id: 'org-user-1', role: 'organizer' },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if ticket belongs to a different event', async () => {
      mockDb.query.events.findFirst.mockResolvedValue(mockEvent);
      mockRegistrationsService.verifyQrHash.mockReturnValue({
        valid: true,
        registrationId: mockRegistration.id,
        eventId: '99999999-9999-9999-9999-999999999999', // Different event
      });

      await expect(
        service.scanAndCheckIn(
          {
            eventId: mockEvent.id,
            qrHash: 'valid:for:different:event',
          },
          { id: 'org-user-1', role: 'organizer' },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if ticket was already scanned (duplicate attendance)', async () => {
      mockDb.query.events.findFirst.mockResolvedValue(mockEvent);
      mockRegistrationsService.verifyQrHash.mockReturnValue({
        valid: true,
        registrationId: mockRegistration.id,
        eventId: mockEvent.id,
      });
      mockDb.query.registrations.findFirst.mockResolvedValue({
        ...mockRegistration,
        attendance: {
          id: 'prev-attendance-id',
          scannedAt: new Date('2026-09-17T10:00:00Z'),
        },
      });

      await expect(
        service.scanAndCheckIn(
          {
            eventId: mockEvent.id,
            qrHash: 'valid:already:scanned',
          },
          { id: 'org-user-1', role: 'organizer' },
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if registration status is CANCELLED', async () => {
      mockDb.query.events.findFirst.mockResolvedValue(mockEvent);
      mockRegistrationsService.verifyQrHash.mockReturnValue({
        valid: true,
        registrationId: mockRegistration.id,
        eventId: mockEvent.id,
      });
      mockDb.query.registrations.findFirst.mockResolvedValue({
        ...mockRegistration,
        status: 'CANCELLED',
        attendance: null,
      });

      await expect(
        service.scanAndCheckIn(
          {
            eventId: mockEvent.id,
            qrHash: 'valid:cancelled:ticket',
          },
          { id: 'org-user-1', role: 'organizer' },
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
