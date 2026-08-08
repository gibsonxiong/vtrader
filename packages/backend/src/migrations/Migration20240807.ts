import { Migration } from '@mikro-orm/migrations';

export class Migration20240807 extends Migration {

  override async up(): Promise<void> {
    // 1. 删除不再使用的 Bar 表
    this.addSql('DROP TABLE IF EXISTS `bar`;');

    // 2. 删除 Prisma 迁移元数据表
    this.addSql('DROP TABLE IF EXISTS `_prisma_migrations`;');

    // 3. 重建 Backtesting 表（添加 createdAt，DECIMAL(30,8) 精度）
    this.addSql('DROP TABLE IF EXISTS `backtesting`;');
    this.addSql(`
      CREATE TABLE \`backtesting\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`brokerId\` VARCHAR(255) NOT NULL,
        \`strategyName\` VARCHAR(255) NOT NULL,
        \`symbol\` VARCHAR(50) NOT NULL,
        \`interval\` VARCHAR(20) NOT NULL,
        \`startDate\` VARCHAR(20) NOT NULL,
        \`endDate\` VARCHAR(20) NOT NULL,
        \`startBalance\` DECIMAL(30,8) NOT NULL,
        \`endBalance\` DECIMAL(30,8) NOT NULL,
        \`maxDrawdown\` DECIMAL(30,8) NOT NULL,
        \`maxDrawdownPercent\` DECIMAL(30,8) NOT NULL,
        \`totalNetPnl\` DECIMAL(30,8) NOT NULL,
        \`totalReturnPercent\` DECIMAL(30,8) NOT NULL,
        \`dailyResults\` JSON NOT NULL,
        \`trades\` JSON NOT NULL,
        \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. 修改 Broker 表 DECIMAL 相关字段（如果有）— Broker 表没有 DECIMAL 字段，保持不变
    // Broker 表结构已兼容，不需要 ALTER
  }

  override async down(): Promise<void> {
    // 回滚：恢复原 Prisma schema 下的表结构
    this.addSql('DROP TABLE IF EXISTS `bar`;');
    this.addSql('DROP TABLE IF EXISTS `backtesting`;');
    this.addSql(`
      CREATE TABLE \`backtesting\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`brokerId\` VARCHAR(191) NOT NULL,
        \`strategyName\` VARCHAR(191) NOT NULL,
        \`symbol\` VARCHAR(191) NOT NULL,
        \`interval\` VARCHAR(191) NOT NULL,
        \`startDate\` VARCHAR(191) NOT NULL,
        \`endDate\` VARCHAR(191) NOT NULL,
        \`startBalance\` DECIMAL(65,30) NOT NULL,
        \`endBalance\` DECIMAL(65,30) NOT NULL,
        \`maxDrawdown\` DECIMAL(65,30) NOT NULL,
        \`maxDrawdownPercent\` DECIMAL(65,30) NOT NULL,
        \`totalNetPnl\` DECIMAL(65,30) NOT NULL,
        \`totalReturnPercent\` DECIMAL(65,30) NOT NULL,
        \`dailyResults\` JSON NOT NULL,
        \`trades\` JSON NOT NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }
}
