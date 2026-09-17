import { Controller, All, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { toNodeHandler } from 'better-auth/node';
import { AuthService } from './auth.service.js';

@Controller('auth')
export class AuthController {
  private readonly nodeHandler: (req: Request, res: Response) => void;

  constructor(private readonly authService: AuthService) {
    this.nodeHandler = toNodeHandler(this.authService.auth.handler);
  }

  @All()
  handleRoot(@Req() req: Request, @Res() res: Response): void {
    return this.nodeHandler(req, res);
  }

  @All('*')
  handleRoutes(@Req() req: Request, @Res() res: Response): void {
    return this.nodeHandler(req, res);
  }
}
