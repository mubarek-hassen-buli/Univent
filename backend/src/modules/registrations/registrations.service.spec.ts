import { ConflictException } from '@nestjs/common';
import { RegistrationsService } from './registrations.service.js';

describe('RegistrationsService', () => {
  let service: RegistrationsService;
  let mockDb: any;
  let mockConfigService: any;

  beforeEach(() => {
    mockDb = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
      innerJoin: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockResolvedValue([]),
      transaction: jest.fn(),
    };

    mockConfigService = {
      getOrThrow: jest.fn().mockReturnValue('mock_qr_hmac_secret_32_characters_long'),
    };

    service = new RegistrationsService(
      { db: mockDb } as any,
      mockConfigService as any,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Cryptographic HMAC QR Token', () => {
    it('should generate and verify valid QR hash token', () => {
      const regId = 'reg-123';
      const eventId = 'evt-456';
      const userId = 'usr-789';

      const qrHash = service.generateQrHash(regId, eventId, userId);
      expect(qrHash).toBeDefined();
      expect(typeof qrHash).toBe('string');

      const verification = service.verifyQrHash(qrHash);
      expect(verification.valid).toBe(true);
      expect(verification.registrationId).toBe(regId);
      expect(verification.eventId).toBe(eventId);
      expect(verification.userId).toBe(userId);
    });

    it('should reject tampered QR hash signature', () => {
      const regId = 'reg-123';
      const eventId = 'evt-456';
      const userId = 'usr-789';

      const qrHash = service.generateQrHash(regId, eventId, userId);
      const parts = qrHash.split(':');
      parts[0] = 'reg-tampered';
      const tamperedHash = parts.join(':');

      const verification = service.verifyQrHash(tamperedHash);
      expect(verification.valid).toBe(false);
    });

    it('should reject malformed QR hash', () => {
      const verification = service.verifyQrHash('invalid:format');
      expect(verification.valid).toBe(false);
    });
  });

  describe('Registration Constraints', () => {
    it('should reject duplicate active registration', async () => {
      mockDb.limit.mockResolvedValueOnce([
        { id: 'existing-reg-id', status: 'CONFIRMED' },
      ]);

      await expect(
        service.registerForEvent('usr-1', 'evt-1'),
      ).rejects.toThrow(ConflictException);
    });
  });
});
