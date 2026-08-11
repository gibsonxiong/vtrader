import { Migration } from '@mikro-orm/migrations';

export class Migration20240811 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`
      ALTER TABLE \`backtesting\`
      ADD COLUMN \`metrics\` JSON NULL
      AFTER \`trades\`;
    `);
  }

  override async down(): Promise<void> {
    this.addSql(`
      ALTER TABLE \`backtesting\`
      DROP COLUMN \`metrics\`;
    `);
  }
}
