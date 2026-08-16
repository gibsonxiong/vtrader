import type { Http } from '../../../types/client';
import { Interval } from '../../../types/common';

jest.mock('../../../client/http', () => ({
  createHttp: jest.fn(),
}));

import BinanceLinearBroker from './index';
import { createHttp } from '../../../client/http';

const createHttpMock = createHttp as jest.Mock;

const TRADING_SYMBOL = {
  symbol: 'BTCUSDT',
  marginAsset: 'USDT',
  status: 'TRADING',
  contractType: 'PERPETUAL',
  filters: [
    { filterType: 'PRICE_FILTER', tickSize: '0.5' },
    { filterType: 'LOT_SIZE', minQty: '0.001' },
  ],
};

function installHttp(handler: (config: any) => any) {
  const request = jest.fn(async (config: any) => handler(config));
  createHttpMock.mockReturnValue({ request } as unknown as Http);
  return request;
}

describe('BinanceLinearBroker REST lazy connection', () => {
  beforeEach(() => {
    createHttpMock.mockReset();
  });

  it('does not connect at construction time', () => {
    const request = installHttp(() => {
      throw new Error('should not be called');
    });

    // eslint-disable-next-line no-new
    new BinanceLinearBroker();

    expect(request).not.toHaveBeenCalled();
  });

  it('connects REST lazily and memoizes the connection for getAllContracts', async () => {
    const request = installHttp((config) => {
      if (config.url === '/fapi/v1/time') return { data: { serverTime: 1_700_000_000_000 } };
      if (config.url === '/fapi/v1/exchangeInfo') return { data: { symbols: [TRADING_SYMBOL] } };
      throw new Error(`unexpected url ${config.url}`);
    });

    const broker = new BinanceLinearBroker();

    const first = await broker.getAllContracts();
    const second = await broker.getAllContracts();

    expect(first).toEqual(second);
    expect(first).toHaveLength(1);
    expect(first[0].symbol).toBe('BTCUSDT:USDT');

    expect(request.mock.calls.filter((c) => c[0].url === '/fapi/v1/time')).toHaveLength(1);
    expect(
      request.mock.calls.filter((c) => c[0].url === '/fapi/v1/exchangeInfo'),
    ).toHaveLength(1);
  });

  it('clears the cache after a failed connection and retries on the next call', async () => {
    let fail = true;
    const request = installHttp((config) => {
      if (config.url === '/fapi/v1/time') {
        if (fail) {
          fail = false;
          throw new Error('network down');
        }
        return { data: { serverTime: 0 } };
      }
      if (config.url === '/fapi/v1/exchangeInfo') return { data: { symbols: [] } };
      throw new Error('unexpected url');
    });

    const broker = new BinanceLinearBroker();

    await expect(broker.getAllContracts()).rejects.toThrow('network down');
    await expect(broker.getAllContracts()).resolves.toEqual([]);

    expect(request.mock.calls.filter((c) => c[0].url === '/fapi/v1/time')).toHaveLength(2);
  });

  it('reuses the established REST client for queryHistory', async () => {
    const request = installHttp((config) => {
      if (config.url === '/fapi/v1/time') return { data: { serverTime: 1_700_000_000_000 } };
      if (config.url === '/fapi/v1/exchangeInfo') return { data: { symbols: [TRADING_SYMBOL] } };
      if (config.url === '/fapi/v1/klines') return { data: [] };
      throw new Error('unexpected url');
    });

    const broker = new BinanceLinearBroker();

    const bars = await broker.queryHistory({
      symbol: 'BTCUSDT:USDT',
      startDate: new Date(1000).toISOString(),
      endDate: new Date(6000).toISOString(),
      interval: Interval.MINUTE_1,
    });

    expect(bars).toEqual([]);
    expect(request.mock.calls.filter((c) => c[0].url === '/fapi/v1/klines')).toHaveLength(1);
  });
});
