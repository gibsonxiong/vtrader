import * as crypto from 'node:crypto';
import {
  onceRejectable,
  sign,
  sendSignedRequest,
  queryTime,
  queryContract,
  queryHistory,
  startUserStream,
} from './index';
import type { Http } from '../../../types/client';
import type { HistoryRequest } from '../../../types/broker';
import { Interval, Product } from '../../../types/common';

function http(handler?: (config: any) => any): Http {
  return {
    request: jest.fn(async (config: any) => (handler ? handler(config) : undefined)),
  } as unknown as Http;
}

describe('binance-linear rest-api pure functions', () => {
  describe('sign', () => {
    afterEach(() => jest.restoreAllMocks());

    it('sorts params and appends an HMAC signature', () => {
      jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);

      const qs = sign({ symbol: 'BTCUSDT', limit: 5 }, 'secret', 1234);

      const timestamp = 1_700_000_000_000 - 1234;
      const expectedQuery = `limit=5&symbol=BTCUSDT&timestamp=${timestamp}`;
      const expectedSig = crypto
        .createHmac('sha256', 'secret')
        .update(expectedQuery)
        .digest('hex');

      expect(qs).toBe(`${expectedQuery}&signature=${expectedSig}`);
    });

    it('overrides a provided timestamp using the time offset', () => {
      jest.spyOn(Date, 'now').mockReturnValue(1_000_000_000);

      const qs = sign({ timestamp: 1, a: 'z' }, 'key', 0);

      expect(qs).toMatch(/^a=z&timestamp=1000000000&signature=[0-9a-f]{64}$/);
    });
  });

  describe('sendSignedRequest', () => {
    it('builds a GET request with params and a params serializer', async () => {
      const client = http(() => ({ data: { ok: true } }));

      const result = await sendSignedRequest(
        client,
        'api-key',
        'api-secret',
        5,
        'GET',
        '/fapi/v1/order',
        { symbol: 'BTCUSDT' },
      );

      expect(result).toEqual({ ok: true });
      const config = (client.request as jest.Mock).mock.calls[0][0];
      expect(config.method).toBe('GET');
      expect(config.url).toBe('/fapi/v1/order');
      expect(config.headers['X-MBX-APIKEY']).toBe('api-key');
      expect(config.params).toEqual({ symbol: 'BTCUSDT' });
      expect(config.paramsSerializer()).toMatch(
        /^symbol=BTCUSDT&timestamp=\d+&signature=[0-9a-f]{64}$/,
      );
    });

    it('builds a POST request with a URL-encoded body', async () => {
      const client = http(() => ({ data: { listenKey: 'k' } }));

      await sendSignedRequest(client, 'api-key', 'secret', 0, 'POST', '/fapi/v1/listenKey');

      const config = (client.request as jest.Mock).mock.calls[0][0];
      expect(config.method).toBe('POST');
      expect(config.data).toMatch(/^timestamp=\d+&signature=[0-9a-f]{64}$/);
      expect(config.params).toBeUndefined();
    });

    it('throws the upstream error message', async () => {
      const client = {
        request: jest.fn(async () => {
          throw { response: { data: { msg: 'bad request' } } };
        }),
      } as unknown as Http;

      await expect(
        sendSignedRequest(client, 'api-key', 'secret', 0, 'GET', '/x'),
      ).rejects.toThrow('bad request');
    });
  });

  describe('queryTime', () => {
    it('returns the server time from the response', async () => {
      const client = http(() => ({ data: { serverTime: 123 } }));

      await expect(queryTime(client)).resolves.toBe(123);
      expect((client.request as jest.Mock).mock.calls[0][0]).toEqual({
        url: '/fapi/v1/time',
      });
    });
  });

  describe('queryContract', () => {
    it('maps TRADING symbols into contracts', async () => {
      const client = http(() => ({
        data: {
          symbols: [
            {
              symbol: 'BTCUSDT',
              marginAsset: 'USDT',
              status: 'TRADING',
              contractType: 'PERPETUAL',
              filters: [
                { filterType: 'PRICE_FILTER', tickSize: '0.5' },
                { filterType: 'LOT_SIZE', minQty: '0.001' },
              ],
            },
            {
              symbol: 'ETHUSDT',
              marginAsset: 'USDT',
              status: 'SETTLING',
              contractType: 'PERPETUAL',
              filters: [],
            },
          ],
        },
      }));

      const result = await queryContract(client);

      expect((client.request as jest.Mock).mock.calls[0][0]).toEqual({
        url: '/fapi/v1/exchangeInfo',
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        symbol: 'BTCUSDT:USDT',
        name: 'BTCUSDT',
        product: Product.SWAP,
        priceTick: 0.5,
        minVolume: 0.001,
        supportStopOrder: true,
        netPosition: true,
        supportHistory: true,
      });
    });

    it('falls back to FUTURES and filter defaults', async () => {
      const client = http(() => ({
        data: {
          symbols: [
            { symbol: 'X', marginAsset: 'Y', status: 'TRADING', contractType: 'UNKNOWN', filters: [] },
          ],
        },
      }));

      const [contract] = await queryContract(client);

      expect(contract.product).toBe(Product.FUTURES);
      expect(contract.priceTick).toBe(0.01);
      expect(contract.minVolume).toBe(1);
    });
  });

  describe('queryHistory', () => {
    const req: HistoryRequest = {
      symbol: 'BTCUSDT:USDT',
      startDate: new Date(1000).toISOString(),
      endDate: new Date(6000).toISOString(),
      interval: Interval.MINUTE_5,
    };

    it('maps kline rows and emits batches', async () => {
      const client = http(() => ({
        data: [
          [1000, '1', '2', '3', '4', '5'],
          [2000, '6', '7', '8', '9', '10'],
        ],
      }));
      const callback = jest.fn();

      const bars = await queryHistory(client, req, 'BTCUSDT', callback);

      expect((client.request as jest.Mock).mock.calls[0][0]).toEqual({
        url: '/fapi/v1/klines',
        params: {
          symbol: 'BTCUSDT',
          interval: '5m',
          limit: 1500,
          startTime: 1000,
          endTime: 6000,
        },
        retryCount: 10,
      });
      expect(bars).toHaveLength(2);
      expect(bars[0]).toEqual({
        symbol: 'BTCUSDT:USDT',
        timestamp: 1000,
        interval: '5m',
        volume: 5,
        open: 1,
        high: 2,
        low: 3,
        close: 4,
      });
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(bars);
    });

    it('returns an empty array when there is no data', async () => {
      const client = http(() => ({ data: [] }));

      const result = await queryHistory(client, req, 'BTCUSDT', jest.fn());

      expect(result).toEqual([]);
    });

    it('throws when the kline request fails', async () => {
      const client = {
        request: jest.fn(async () => {
          throw new Error('boom');
        }),
      } as unknown as Http;

      await expect(queryHistory(client, req, 'BTCUSDT', jest.fn())).rejects.toThrow('boom');
    });

    it('pages through multiple kline responses', async () => {
      jest.useFakeTimers();
      try {
        const client = {
          request: jest.fn(async (config: any) => {
            if (config.params.startTime === 1000) {
              const rows = Array.from({ length: 1500 }, (_, i) => [i, '1', '2', '3', '4', '5']);
              return { data: rows };
            }
            return { data: [[5000, '1', '2', '3', '4', '5']] };
          }),
        } as unknown as Http;
        const callback = jest.fn();

        const promise = queryHistory(client, req, 'BTCUSDT', callback);

        for (let i = 0; i < 20 && jest.getTimerCount() === 0; i += 1) {
          await Promise.resolve();
        }
        expect(jest.getTimerCount()).toBeGreaterThan(0);

        jest.advanceTimersByTime(500);
        await Promise.resolve();
        await Promise.resolve();

        const bars = await promise;

        expect(client.request).toHaveBeenCalledTimes(2);
        const nextParams = (client.request as jest.Mock).mock.calls[1][0].params;
        expect(nextParams.startTime).toBeGreaterThan(1499);
        expect(bars).toHaveLength(1501);
        expect(callback).toHaveBeenCalledTimes(2);
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe('startUserStream', () => {
    it('POSTs to listenKey and returns the key', async () => {
      const client = http(() => ({ data: { listenKey: 'listen-123' } }));

      await expect(startUserStream(client, 'api-key', 'secret', 0)).resolves.toBe('listen-123');

      const config = (client.request as jest.Mock).mock.calls[0][0];
      expect(config.method).toBe('POST');
      expect(config.url).toBe('/fapi/v1/listenKey');
    });
  });
});

describe('onceRejectable', () => {
  it('memoizes a successful promise', async () => {
    const fn = jest.fn(async (x: number) => x + 1);
    const once = onceRejectable(fn);

    await expect(once.run(1)).resolves.toBe(2);
    await expect(once.run(1)).resolves.toBe(2);
    await expect(once.run(2)).resolves.toBe(2);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('clears the cache after a failure so the next call retries', async () => {
    let calls = 0;
    const fn = jest.fn(async () => {
      calls += 1;
      if (calls === 1) throw new Error('first');
      return 'ok';
    });
    const once = onceRejectable(fn);

    await expect(once.run()).rejects.toThrow('first');
    await expect(once.run()).resolves.toBe('ok');

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('reset allows re-running after a success', async () => {
    const fn = jest.fn(async () => 'ok');
    const once = onceRejectable(fn);

    await once.run();
    once.reset();
    await once.run();

    expect(fn).toHaveBeenCalledTimes(2);
  });
});
