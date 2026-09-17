import { Injectable, Inject } from '@nestjs/common';
import { fromNodeHeaders } from 'better-auth/node';
import type { IncomingHttpHeaders } from 'node:http';
import { AUTH_INSTANCE } from './auth.constants.js';
import type { AuthInstance } from './auth.instance.js';

@Injectable()
export class AuthService {
  constructor(
    @Inject(AUTH_INSTANCE)
    public readonly auth: AuthInstance,
  ) {}

  async getSession(headers: IncomingHttpHeaders) {
    return this.auth.api.getSession({
      headers: fromNodeHeaders(headers),
    });
  }
}
