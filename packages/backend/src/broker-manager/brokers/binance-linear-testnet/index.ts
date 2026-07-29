import BinanceLinearBroker from 'src/broker-manager/brokers/binance-linear';
import type { BrokerType } from 'src/types/broker';

export default class BinanceLinearTestnetBroker extends BinanceLinearBroker {
  REST_HOST = 'https://testnet.binancefuture.com';
  TRADE_HOST = 'wss://testnet.binancefuture.com/ws-fapi/v1';
  USER_HOST = 'wss://fstream.binancefuture.com/ws';
  DATA_HOST = 'wss://fstream.binancefuture.com/stream';

  public getBrokerType(): BrokerType {
    return 'BINANCE_LINEAR_TESTNET';
  }
}
