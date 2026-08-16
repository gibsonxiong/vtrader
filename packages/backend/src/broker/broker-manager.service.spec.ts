import { BrokerManagerService } from './broker-manager.service';
import type { BrokerService } from './broker.service';
import type { BrokerModel } from '../types/broker';

describe('BrokerManagerService (lazy connection)', () => {
  function makeConfig(overrides: Partial<BrokerModel> = {}): BrokerModel {
    return {
      id: 'broker-1',
      name: 'binance-linear',
      brokerType: 'BINANCE_LINEAR',
      apiKey: 'api-key-1',
      apiSecret: 'api-secret-1',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  function makeManager(overrides: Partial<BrokerModel> = {}) {
    const configs = [makeConfig(overrides)];
    const brokerService = {
      getConfig: jest.fn(async (brokerId: string) => configs.find((c) => c.id === brokerId)),
      getConfigByType: jest.fn(async () => configs),
    } as unknown as BrokerService;

    return { manager: new BrokerManagerService(brokerService), brokerService };
  }

  it('constructs broker without connecting and injects credentials via setCredentials', async () => {
    const { manager } = makeManager();

    const broker = await manager.getBroker('broker-1');

    expect(broker).toBeDefined();
    expect(broker.getCredentials()).toEqual({
      apiKey: 'api-key-1',
      apiSecret: 'api-secret-1',
    });
  });

  it('reuses the same instance for the same broker id (promise dedup)', async () => {
    const { manager } = makeManager();

    const first = await manager.getBroker('broker-1');
    const second = await manager.getBroker('broker-1');

    expect(first).toBe(second);
  });

  it('can construct with empty keys (will only fail on first lazy connection)', async () => {
    const { manager } = makeManager({ apiKey: '', apiSecret: '' });

    const broker = await manager.getBroker('broker-1');

    expect(broker.getCredentials()).toEqual({ apiKey: '', apiSecret: '' });
  });

  it('throws when broker config is not found', async () => {
    const { manager } = makeManager();

    await expect(manager.getBroker('missing')).rejects.toThrow('missing');
  });

  it('throws when broker type is not found', async () => {
    const { manager } = makeManager({ brokerType: 'UNKNOWN' as any });

    await expect(manager.getBroker('broker-1')).rejects.toThrow('UNKNOWN');
  });

  it('creates a mock broker without connecting', async () => {
    const { manager } = makeManager();

    const mock = await manager.createMockBroker({
      brokerType: 'BINANCE_LINEAR',
      commissionRate: 0.0002,
      assetBalance: 10000,
    });

    expect(mock).toBeDefined();
    expect(mock.getBrokerType()).toBe('BINANCE_LINEAR');
  });
});
