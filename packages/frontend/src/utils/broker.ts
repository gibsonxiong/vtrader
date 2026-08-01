const brokerTypeLabels: Record<string, string> = {
  BINANCE_LINEAR: 'Binance合约',
  BINANCE_LINEAR_TESTNET: 'Binance合约(测试)',
}

export function formatBrokerType(type: string): string {
  return brokerTypeLabels[type] || type
}
