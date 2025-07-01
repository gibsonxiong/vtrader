import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma.service';
import { Backtesting, Prisma } from 'generated/client';

@Injectable()
export class BacktestingService {
  constructor(
    private prisma: PrismaService
  ) {}

  create(params: {
    data: Prisma.BacktestingCreateInput
  }): Promise<Backtesting> {
    const { data } = params;
    return this.prisma.backtesting.create({
      data,
    });
  }

  findMany(params?: {
    skip?: number;
    take?: number;
    cursor?: Prisma.BacktestingWhereUniqueInput;
    where?: Prisma.BacktestingWhereInput;
    orderBy?: Prisma.BacktestingOrderByWithRelationInput;
  }): Promise<Backtesting[]> {
    const { skip, take, cursor, where, orderBy  } = params ?? {};
    return this.prisma.backtesting.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy
    });
  }

  find(params: {
    where: Prisma.BacktestingWhereUniqueInput,
  }): Promise<Backtesting | null> {
    const { where } = params;
    return this.prisma.backtesting.findUnique({
      where
    })
  }

  removeMany(params: {
    where: Prisma.BacktestingWhereUniqueInput;
  }) {
    const { where } = params;
    return this.prisma.backtesting.deleteMany({
      where
    })
  }

  remove(params: {
    where: Prisma.BacktestingWhereUniqueInput;
  }) {
    const { where } = params;
    return this.prisma.backtesting.delete({
      where
    })
  }

  update(params: {
    where: Prisma.BacktestingWhereUniqueInput;
    data: Prisma.BacktestingUpdateInput;
  }) {
    const { where, data } = params;
    return this.prisma.backtesting.update({
      where,
      data,
    })
  }
}
