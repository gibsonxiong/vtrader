// import {
//   BinanceLinearGateway,
//   GatewaySettings,
// } from '../gateways/binance-linear';
// import { Exchange, Interval } from '../types/common';
// import { PrismaService } from '../../../prisma.service';

// async function main() {
//   const prisma = new PrismaService();
//   const gateway = new BinanceLinearGateway();
//   const settings: GatewaySettings = {
//     apiKey: '1c5f9a2a4faefc20b1c0667cecef2ce8998f68133540b1c87a72886d6d3adac6',
//     apiSecret: '3ca3aa8dd892bdecd473fa419fc50658826ff5a864c52956ad670652416a26de',
//     server: 'TESTNET',
//     klineStream: true,
//     proxyHost: '127.0.0.1',
//     proxyPort: 7890,
//   };
//   await gateway.connect(settings);

//   await prisma.$connect();

//   const bars = await gateway.queryHistory({
//     start: '2025-01-01',
//     end: '2025-03-01',
//     exchange: Exchange.BINANCE,
//     interval: Interval.MINUTE_5,
//     symbol: 'BTCUSDT:USDT',
//   });

//   await prisma.bar.createMany({
//     data: bars,
//     skipDuplicates: true,
//   });
// }

// main();
