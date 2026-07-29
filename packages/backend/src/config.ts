import type { BrokerType } from 'src/types/broker';

export default {
  brokers: [
    {
      id: 'binance_test',
      brokerType: 'BINANCE_LINEAR_TESTNET' as BrokerType,
      settings: {
        apiKey: 'nzadRyiGuHIrLZGHuFeMiyING98FbpZi9127Lf3I8GvMCgMcc70QqZqnVInkFJx7',
        apiSecret: 'KgyQpJrZiYkHsKl4Abj0cy6XwN12bAbxQ2jhbYNUAt6cysSpaEg4Eh7Ry1VEwsTM',
        // server: 'TESTNET',
        // klineStream: true,
        // proxyHost: '127.0.0.1',
        // proxyPort: 7890,
      },
    },
    {
      id: 'binance',
      brokerType: 'BINANCE_LINEAR' as BrokerType,
      settings: {
        apiKey: 'TevA3pVbTn3BycSYUYy056s4BvRkxSYGOCu0pHnQjCpoiBigOZCyx9toFACieNDR',
        apiSecret: 'bbqn2tSLGvJ4RTbYt2ccoPK64995yaqJJzW7Gbfng2QnwuJtwzCc2CBlFONzNyCA',
        // server: 'TESTNET',
        // klineStream: true,
        // proxyHost: '127.0.0.1',
        // proxyPort: 7890,
      },
    },
  ],
};
