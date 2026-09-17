import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

export interface CloudinarySignature {
  timestamp: number;
  folder: string;
  signature: string;
  apiKey: string;
  cloudName: string;
}

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly cloudName: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.getOrThrow<string>('CLOUDINARY_API_KEY');
    this.apiSecret = this.configService.getOrThrow<string>('CLOUDINARY_API_SECRET');
    this.cloudName = this.configService.getOrThrow<string>('CLOUDINARY_CLOUD_NAME');

    cloudinary.config({
      cloud_name: this.cloudName,
      api_key: this.apiKey,
      api_secret: this.apiSecret,
      secure: true,
    });
  }

  getSignedUploadParams(folder = 'univent/events'): CloudinarySignature {
    const timestamp = Math.round(Date.now() / 1000);
    const paramsToSign = {
      folder,
      timestamp,
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      this.apiSecret,
    );

    return {
      timestamp,
      folder,
      signature,
      apiKey: this.apiKey,
      cloudName: this.cloudName,
    };
  }
}
