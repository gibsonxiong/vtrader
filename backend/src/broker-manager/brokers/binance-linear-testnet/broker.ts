import BinanceLinearBroker from 'src/broker-manager/brokers/binance-linear/broker';

export default class BinanceLinearTestnetBroker extends BinanceLinearBroker {
  brokerName = 'BINANCE_LINEAR_TESTNET';
  REST_HOST = 'https://testnet.binancefuture.com';
  TRADE_HOST = 'wss://testnet.binancefuture.com/ws-fapi/v1';
  USER_HOST = 'wss://fstream.binancefuture.com/ws';
  DATA_HOST = 'wss://fstream.binancefuture.com/stream';
}
