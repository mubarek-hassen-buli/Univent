import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import type { ZodSchema } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema?: ZodSchema) {}

  transform(value: unknown, metadata?: ArgumentMetadata): unknown {
    // If metadata indicates this is a custom param (e.g. @CurrentUser) or route param (@Param), bypass validation
    if (metadata && metadata.type !== 'body' && metadata.type !== 'query') {
      return value;
    }

    if (!this.schema) {
      return value;
    }

    let dataToValidate = value;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (
        (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
        (trimmed.startsWith('[') && trimmed.endsWith(']'))
      ) {
        try {
          dataToValidate = JSON.parse(trimmed);
        } catch {
          // leave as string
        }
      }
    }

    const result = this.schema.safeParse(dataToValidate);

    if (!result.success) {
      const issues = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));

      throw new BadRequestException({
        message: 'Validation failed',
        errors: issues,
      });
    }

    return result.data;
  }
}
