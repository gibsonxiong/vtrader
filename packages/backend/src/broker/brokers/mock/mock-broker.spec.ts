import { MockBroker } from './mock-broker';
import BinanceLinearBroker from '../binance-linear';
import type { ContractData } from '../../../types/common';
import { Interval } from '../../../types/common';
import type { MockBrokerProps, SubscribeRequest } from '../../../types/broker';

const props: MockBrokerProps = {
  brokerType: 'BINANCE_LINEAR',
  commissionRate: 0.0002,
  assetBalance: 10000,
};

describe('MockBroker passthrough', () => {
  afterEach(() => jest.restoreAllMocks());

  it('delegates setCredentials to the inner broker', () => {
    const broker = new MockBroker(props);
    const spy = jest
      .spyOn(BinanceLinearBroker.prototype, 'setCredentials')
      .mockImplementation(() => {});

    broker.setCredentials({ apiKey: 'k', apiSecret: 's' });

    expect(spy).toHaveBeenCalledWith({ apiKey: 'k', apiSecret: 's' });
  });

  it('delegates getBrokerType to the inner broker', () => {
    const broker = new MockBroker(props);

    expect(broker.getBrokerType()).toBe('BINANCE_LINEAR');
  });

  it('passes through the async getAllContracts result', async () => {
    const broker = new MockBroker(props);
    const contracts: ContractData[] = [
      {
        symbol: 'BTCUSDT:USDT',
        name: 'BTCUSDT',
        minVolume: 0.001,
        priceTick: 0.5,
        product: 'SWAP',
        netPosition: true,
        supportHistory: true,
        supportStopOrder: true,
      } as ContractData,
    ];
    const spy = jest
      .spyOn(BinanceLinearBroker.prototype, 'getAllContracts')
      .mockResolvedValue(contracts);

    await expect(broker.getAllContracts()).resolves.toBe(contracts);
  });

  it('passes through the async subscribeBar and unsubscribeBar results', async () => {
    const broker = new MockBroker(props);
    const subscribeSpy = jest
      .spyOn(BinanceLinearBroker.prototype, 'subscribeBar')
      .mockResolvedValue(undefined);
    const unsubscribeSpy = jest
      .spyOn(BinanceLinearBroker.prototype, 'unsubscribeBar')
      .mockResolvedValue(undefined);
    const req: SubscribeRequest = { symbol: 'BTCUSDT:USDT', interval: Interval.MINUTE_5 };

    await broker.subscribeBar(req);
    await broker.unsubscribeBar(req);

    expect(subscribeSpy).toHaveBeenCalledWith(req);
    expect(unsubscribeSpy).toHaveBeenCalledWith(req);
  });
});
