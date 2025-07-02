import { Injectable } from '@nestjs/common';
import { Backtesting, Prisma } from 'generated/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class BacktestingService {
  constructor(private prisma: PrismaService) {}

  create(params: { data: Prisma.BacktestingCreateInput }): Promise<Backtesting> {
    const { data } = params;
    return this.prisma.backtesting.create({
      data,
    });
  }

  find(params: { where: Prisma.BacktestingWhereUniqueInput }): Promise<Backtesting | null> {
    const { where } = params;
    return this.prisma.backtesting.findUnique({
      where,
    });
  }

  findMany(params?: {
    cursor?: Prisma.BacktestingWhereUniqueInput;
    orderBy?: Prisma.BacktestingOrderByWithRelationInput;
    skip?: number;
    take?: number;
    where?: Prisma.BacktestingWhereInput;
  }): Promise<Backtesting[]> {
    const { skip, take, cursor, where, orderBy } = params ?? {};
    return this.prisma.backtesting.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  remove(params: { where: Prisma.BacktestingWhereUniqueInput }) {
    const { where } = params;
    return this.prisma.backtesting.delete({
      where,
    });
  }

  removeMany(params: { where: Prisma.BacktestingWhereUniqueInput }) {
    const { where } = params;
    return this.prisma.backtesting.deleteMany({
      where,
    });
  }

  update(params: {
    data: Prisma.BacktestingUpdateInput;
    where: Prisma.BacktestingWhereUniqueInput;
  }) {
    const { where, data } = params;
    return this.prisma.backtesting.update({
      where,
      data,
    });
  }
}
