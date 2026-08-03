import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { BusinessException } from './exceptions';

/**
 * 全局异常过滤器
 *
 * 统一所有异常为 `{ code, msg, data: null }` 格式，与正常响应保持一致。
 * 三类异常处理：
 * 1. BusinessException — 业务异常，使用自定义 code/msg
 * 2. HttpException — NestJS 内置异常，映射 HTTP 状态码为 code
 * 3. Error / 其他 — 未预期异常，返回 50000 并隐藏内部细节
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { method, url } = request;
    let status: number;
    let body: { code: number; msg: string; data: null };

    if (exception instanceof BusinessException) {
      const resp = exception.getResponse() as { code: number; msg: string; data: null };
      status = exception.getStatus();
      body = resp;
      this.logger.warn(`[${method} ${url}] ${body.code} ${body.msg}`);
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResp = exception.getResponse();
      const rawMsg: unknown =
        typeof exResp === 'string'
          ? exResp
          : typeof exResp === 'object' && exResp !== null
            ? (exResp as any).message ?? exception.message
            : exception.message;
      const msg = Array.isArray(rawMsg) ? rawMsg.join('; ') : String(rawMsg);
      body = { code: status, msg, data: null };
      this.logger.warn(`[${method} ${url}] ${status} ${msg}`);
    } else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      body = { code: 50000, msg: '服务器内部错误', data: null };
      this.logger.error(
        `[${method} ${url}] 未处理异常 — ${exception.message}`,
        exception.stack,
      );
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      body = { code: 50000, msg: '未知错误', data: null };
      this.logger.error(`[${method} ${url}] 未知异常类型: ${String(exception)}`);
    }

    response.status(status).json(body);
  }
}
