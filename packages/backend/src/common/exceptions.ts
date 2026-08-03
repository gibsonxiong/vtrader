import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * 业务异常体系
 *
 * 所有业务异常统一返回 HTTP 200 + `{ code, msg, data: null }` 格式，
 * 错误类型通过 body.code 区分，不依赖 HTTP 状态码。
 */

/** 基础业务异常 */
export class BusinessException extends HttpException {
  constructor(message: string, code: number) {
    super({ code, msg: message, data: null }, HttpStatus.OK);
  }

  /** 从异常中提取业务错误码 */
  static getErrorCode(exception: BusinessException): number {
    const resp = exception.getResponse();
    return typeof resp === 'object' && resp !== null ? (resp as any).code ?? 1 : 1;
  }
}

/** 参数校验失败 — code: 40001 */
export class ValidationException extends BusinessException {
  constructor(message: string) {
    super(message, 40001);
  }
}

/** 资源不存在 — code: 40400 */
export class NotFoundException extends BusinessException {
  constructor(message: string) {
    super(message, 40400);
  }
}

/** 服务器内部错误（通用）— code: 50000 */
export class InternalException extends BusinessException {
  constructor(message = '服务器内部错误') {
    super(message, 50000);
  }
}

/** 队列/任务异常 — code: 50001 */
export class QueueException extends BusinessException {
  constructor(message: string) {
    super(message, 50001);
  }
}

/** 外部服务异常（broker API / Redis）— code: 50002 */
export class ExternalServiceException extends BusinessException {
  constructor(message: string) {
    super(message, 50002);
  }
}

/** 数据库异常 — code: 50003 */
export class DatabaseException extends BusinessException {
  constructor(message: string) {
    super(message, 50003);
  }
}
