import type { Prisma } from "src/generated/client";

export class CreateBacktestingDto implements Prisma.BacktestingCreateInput {
  name: string;

  constructor(name: string) {
    this.name = name;
  }
}
