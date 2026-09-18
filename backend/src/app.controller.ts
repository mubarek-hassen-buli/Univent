import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getRoot() {
    return {
      status: 'healthy',
      name: 'Univent Backend API',
      version: '1.0.0',
      message: 'Univent API is online and operational',
      endpoints: {
        auth: '/api/auth',
        events: '/api/events',
        users: '/api/users',
        analytics: '/api/analytics',
      },
    };
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  getHello(): string {
    return this.appService.getHello();
  }
}
