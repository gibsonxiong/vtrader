import {
  BinanceLinearGateway,
  Exchange,
  GatewaySettings,
} from '../gateways/binance-linear-gateway';

const gateway = new BinanceLinearGateway();

const settings: GatewaySettings = {
  apiKey: '1c5f9a2a4faefc20b1c0667cecef2ce8998f68133540b1c87a72886d6d3adac6',
  apiSecret: '3ca3aa8dd892bdecd473fa419fc50658826ff5a864c52956ad670652416a26de',
  server: 'TESTNET',
  klineStream: true,
  proxyHost: '127.0.0.1',
  proxyPort: 7890,
};

async function main() {
  await gateway.connect(settings);

  setTimeout(() => {
    gateway.subscribe({ symbol: 'BTCUSDT:USDT', exchange: Exchange.BINANCE });

    // gateway.on('tick', (tick) => {
    //   console.log('收到Tick数据:', tick);
    // });

    // gateway.on('bar', (bar) => {
    //   console.log('收到K线数据:', bar);
    // });

    gateway.on('position', (position) => {
      console.log('持仓数据:', position);
    });
  }, 3000);
}

main();
