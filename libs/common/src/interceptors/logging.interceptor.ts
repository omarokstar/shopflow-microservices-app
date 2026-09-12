import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { randomUUID } from 'crypto';

// Attach correlationId to trace requests across services.
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const start = Date.now();

    const correlationId =
      request.headers['x-correlation-id'] ?? randomUUID();
    request.headers['x-correlation-id'] = correlationId;

    return next.handle().pipe(
      tap(() => {
        this.logger.log(
          JSON.stringify({
            correlationId,
            method: request.method,
            url: request.url,
            durationMs: Date.now() - start,
          }),
        );
      }),
    );
  }
}
