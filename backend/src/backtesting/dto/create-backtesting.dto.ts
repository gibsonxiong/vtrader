import type { Prisma } from 'generated/client';

export class CreateBacktestingDto implements Prisma.BacktestingCreateInput {
  name: string;

  constructor(name: string) {
    this.name = name;
  }
}
