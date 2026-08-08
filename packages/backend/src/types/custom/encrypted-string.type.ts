import { Type } from '@mikro-orm/core';
import { Logger } from '@nestjs/common';
import { encrypt, decrypt } from '../../utils/crypto';

const logger = new Logger('EncryptedStringType');

/**
 * MikroORM Custom Type: 透明 AES-256-GCM 加解密字符串
 *
 * 写入 DB 时自动加密，读出时自动解密。
 * 数据库无关——DB 始终只看到 VARCHAR 字符串。
 */
export class EncryptedStringType extends Type<string, string> {
  convertToDatabaseValue(value: string): string {
    if (!value) return value;
    return encrypt(value);
  }

  convertToJSValue(value: string): string {
    if (!value) return value;
    try {
      return decrypt(value);
    } catch (err) {
       logger.error(
        `解密失败，可能数据已损坏或 MASTER_KEY 已变更。` +
        `密文前10字符: ${value.substring(0, 10)}...`,
      );
      throw err; // 抛出异常，让上层感知并处理
    }
  }

  getColumnType(): string {
    return 'varchar(500)';
  }
}
