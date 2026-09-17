import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Pusher from 'pusher';
import type { EnvConfig } from '../../config/env.schema.js';

@Injectable()
export class PusherService {
  private readonly logger = new Logger(PusherService.name);
  private pusher: Pusher | null = null;
  private readonly isConfigured: boolean;

  constructor(private readonly configService: ConfigService<EnvConfig, true>) {
    const appId = this.configService.get('PUSHER_APP_ID', { infer: true });
    const key = this.configService.get('PUSHER_KEY', { infer: true });
    const secret = this.configService.get('PUSHER_SECRET', { infer: true });
    const cluster = this.configService.get('PUSHER_CLUSTER', { infer: true });

    if (
      appId &&
      key &&
      secret &&
      appId !== 'sample_app_id' &&
      key !== 'sample_pusher_key'
    ) {
      try {
        this.pusher = new Pusher({
          appId,
          key,
          secret,
          cluster: cluster || 'mt1',
          useTLS: true,
        });
        this.isConfigured = true;
        this.logger.log(`Pusher real-time client initialized on cluster [${cluster}]`);
      } catch (err) {
        this.logger.warn(`Failed to initialize Pusher: ${(err as Error).message}`);
        this.isConfigured = false;
      }
    } else {
      this.isConfigured = false;
      this.logger.log('Pusher running in stub/mock mode (sample credentials configured)');
    }
  }

  async trigger(channel: string, event: string, data: unknown): Promise<void> {
    if (!this.isConfigured || !this.pusher) {
      this.logger.debug(
        `[Stub Pusher Broadcast] Channel: "${channel}", Event: "${event}"`,
      );
      return;
    }

    try {
      await this.pusher.trigger(channel, event, data);
      this.logger.debug(`Broadcasted event "${event}" to channel "${channel}"`);
    } catch (err) {
      this.logger.error(
        `Error triggering Pusher event "${event}" on "${channel}": ${(err as Error).message}`,
      );
    }
  }
}
