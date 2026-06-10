import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@vtrader/shared/prismaClient';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}

// @Injectable()
// export class PrismaService implements OnModuleInit {
//   barOverview: any;
//   bar: any;
//   backtesting: any;


//   async onModuleInit() {
//     // await this.$connect();
//   }
// }
