import { MikroORM } from '@mikro-orm/mysql';
import config from '../mikro-orm.config';

let _orm: MikroORM | null = null;

/**
 * 惰性单例：获取 MikroORM 实例（供 sandbox processor 使用）
 *
 * 在 BullMQ sandbox（Worker Thread）中，模块加载时调用一次。
 * 后续所有 job 复用同一个 orm 实例。
 */
export async function getORM(): Promise<MikroORM> {
  if (!_orm) {
    _orm = await MikroORM.init(config);
    // 自动运行 migration（sandbox 环境）
    const migrator = _orm.getMigrator();
    await migrator.up();
  }
  return _orm;
}
