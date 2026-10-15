import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

/**
 * Bắt mọi lỗi và trả về một định dạng thống nhất:
 * { success: false, error: { statusCode, message, path, timestamp } }
 * Lỗi không phải HttpException (bug, lỗi hệ thống) thành 500, không lộ chi tiết.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | string[] = 'Internal server error';
    if (isHttp) {
      const body = exception.getResponse();
      message =
        typeof body === 'string'
          ? body
          : ((body as { message?: string | string[] }).message ??
            exception.message);
    }

    res.status(status).json({
      success: false,
      error: {
        statusCode: status,
        message,
        path: req.url,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
