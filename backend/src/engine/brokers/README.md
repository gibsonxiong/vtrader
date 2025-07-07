# Binance Linear Gateway

这是一个基于TypeScript实现的Binance线性合约网关，参考了vnpy的设计架构，提供了完整的交易功能。

## 功能特性

- **REST API**: 支持查询合约信息、历史数据、账户信息等
- **WebSocket连接**: 实时接收市场数据、订单更新、账户变化
- **订单管理**: 支持限价单、市价单的发送和撤销
- **数据订阅**: 支持Tick数据、K线数据、深度数据订阅
- **风险控制**: 内置订单状态管理和错误处理
- **多环境支持**: 支持实盘和测试网环境

## 快速开始

### 1. 基本配置

```typescript
import { BinanceLinearGateway, GatewaySettings } from './binance-linear-gateway';

// 创建网关实例
const gateway = new BinanceLinearGateway();

// 配置参数
const settings: GatewaySettings = {
  apiKey: 'your_api_key',
  apiSecret: 'your_api_secret',
  server: 'TESTNET', // 或 'REAL'
  klineStream: true, // 是否订阅K线数据
  proxyHost: undefined, // 可选代理设置
  proxyPort: undefined,
};
```

### 2. 连接到交易所

```typescript
async function connectGateway() {
  try {
    await gateway.connect(settings);
    console.log('网关连接成功');
  } catch (error) {
    console.error('连接失败:', error);
  }
}

connectGateway();
```

### 3. 事件监听

```typescript
// 监听Tick数据
gateway.on('tick', (tick) => {
  console.log('收到Tick数据:', tick);
});

// 监听K线数据
gateway.on('bar', (bar) => {
  console.log('收到K线数据:', bar);
});

// 监听订单更新
gateway.on('order', (order) => {
  console.log('订单更新:', order);
});

// 监听成交数据
gateway.on('trade', (trade) => {
  console.log('成交数据:', trade);
});

// 监听账户数据
gateway.on('account', (account) => {
  console.log('账户数据:', account);
});

// 监听持仓数据
gateway.on('position', (position) => {
  console.log('持仓数据:', position);
});

// 监听合约数据
gateway.on('contract', (contract) => {
  console.log('合约数据:', contract);
});
```

### 4. 订阅市场数据

```typescript
import { SubscribeRequest, Exchange } from './binance-linear-gateway';

// 订阅BTCUSDT永续合约
const subscribeReq: SubscribeRequest = {
  symbol: 'BTCUSDT:USDT',
  exchange: Exchange.BINANCE,
};

gateway.subscribe(subscribeReq);
```

### 5. 发送订单

```typescript
import { OrderRequest, Direction, OrderType } from './binance-linear-gateway';

// 发送限价买单
const orderReq: OrderRequest = {
  symbol: 'BTCUSDT:USDT',
  exchange: Exchange.BINANCE,
  direction: Direction.LONG,
  type: OrderType.LIMIT,
  volume: 0.001,
  price: 50000,
  reference: 'my_order_001',
};

const orderId = gateway.sendOrder(orderReq);
console.log('订单ID:', orderId);
```

### 6. 撤销订单

```typescript
import { CancelRequest } from './binance-linear-gateway';

const cancelReq: CancelRequest = {
  orderId: 'order_id_to_cancel',
  symbol: 'BTCUSDT:USDT',
  exchange: Exchange.BINANCE,
};

gateway.cancelOrder(cancelReq);
```

### 7. 查询历史数据

```typescript
import { HistoryRequest, Interval } from './binance-linear-gateway';

async function queryHistory() {
  const historyReq: HistoryRequest = {
    symbol: 'BTCUSDT:USDT',
    exchange: Exchange.BINANCE,
    start: new Date('2024-01-01'),
    end: new Date('2024-01-02'),
    interval: Interval.HOUR,
  };

  try {
    const bars = await gateway.queryHistory(historyReq);
    console.log('历史数据:', bars);
  } catch (error) {
    console.error('查询历史数据失败:', error);
  }
}

queryHistory();
```

## 完整示例

```typescript
import {
  BinanceLinearGateway,
  GatewaySettings,
  SubscribeRequest,
  OrderRequest,
  Exchange,
  Direction,
  OrderType,
  Interval,
} from './binance-linear-gateway';

class TradingBot {
  private gateway: BinanceLinearGateway;

  constructor() {
    this.gateway = new BinanceLinearGateway();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.gateway.on('tick', (tick) => {
      this.onTick(tick);
    });

    this.gateway.on('order', (order) => {
      this.onOrder(order);
    });

    this.gateway.on('trade', (trade) => {
      this.onTrade(trade);
    });
  }

  public async start(): Promise<void> {
    const settings: GatewaySettings = {
      apiKey: process.env.BINANCE_API_KEY!,
      apiSecret: process.env.BINANCE_API_SECRET!,
      server: 'TESTNET',
      klineStream: true,
    };

    try {
      await this.gateway.connect(settings);
      console.log('交易机器人启动成功');

      // 订阅市场数据
      this.gateway.subscribe({
        symbol: 'BTCUSDT:USDT',
        exchange: Exchange.BINANCE,
      });
    } catch (error) {
      console.error('启动失败:', error);
    }
  }

  private onTick(tick: any): void {
    console.log(`${tick.symbol} 最新价格: ${tick.lastPrice}`);

    // 实现交易逻辑
    if (this.shouldBuy(tick)) {
      this.sendBuyOrder(tick.symbol, tick.lastPrice);
    }
  }

  private onOrder(order: any): void {
    console.log(`订单状态更新: ${order.orderId} - ${order.status}`);
  }

  private onTrade(trade: any): void {
    console.log(`成交: ${trade.symbol} ${trade.direction} ${trade.volume}@${trade.price}`);
  }

  private shouldBuy(tick: any): boolean {
    // 实现买入信号逻辑
    return false;
  }

  private sendBuyOrder(symbol: string, price: number): void {
    const orderReq: OrderRequest = {
      symbol,
      exchange: Exchange.BINANCE,
      direction: Direction.LONG,
      type: OrderType.LIMIT,
      volume: 0.001,
      price: price * 0.999, // 稍低于市价
    };

    const orderId = this.gateway.sendOrder(orderReq);
    console.log(`发送买单: ${orderId}`);
  }

  public stop(): void {
    this.gateway.close();
    console.log('交易机器人已停止');
  }
}

// 使用示例
const bot = new TradingBot();
bot.start();

// 优雅关闭
process.on('SIGINT', () => {
  bot.stop();
  process.exit(0);
});
```

## 数据结构

### TickData

```typescript
interface TickData {
  symbol: string; // 合约代码
  datetime: Date; // 时间戳
  name: string; // 合约名称
  volume: number; // 成交量
  lastPrice: number; // 最新价
  lastVolume: number; // 最新成交量
  limit_up: number; // 涨停价
  limit_down: number; // 跌停价
  openPrice: number; // 开盘价
  highPrice: number; // 最高价
  lowPrice: number; // 最低价
  preClose: number; // 昨收价
  bidPrice1: number; // 买一价
  askPrice1: number; // 卖一价
  bidVolume1: number; // 买一量
  askVolume1: number; // 卖一量
  // ... 更多买卖档位
}
```

### OrderData

```typescript
interface OrderData {
  symbol: string; // 合约代码
  exchange: string; // 交易所
  orderId: string; // 订单号
  type: OrderType; // 订单类型
  direction: Direction; // 买卖方向
  offset: string; // 开平仓
  price: number; // 价格
  volume: number; // 数量
  traded: number; // 已成交数量
  status: OrderStatus; // 订单状态
  time: Date; // 时间
}
```

### BarData

```typescript
interface BarData {
  symbol: string; // 合约代码
  datetime: Date; // 时间戳
  interval: string; // 时间间隔
  volume: number; // 成交量
  openPrice: number; // 开盘价
  highPrice: number; // 最高价
  lowPrice: number; // 最低价
  closePrice: number; // 收盘价
}
```

## 配置说明

### GatewaySettings

- `apiKey`: Binance API密钥
- `apiSecret`: Binance API密钥密码
- `server`: 服务器环境 ('REAL' | 'TESTNET')
- `klineStream`: 是否订阅K线数据流
- `proxyHost`: 代理服务器地址（可选）
- `proxyPort`: 代理服务器端口（可选）

## 注意事项

1. **API密钥安全**: 请妥善保管API密钥，不要在代码中硬编码
2. **测试环境**: 建议先在测试网环境进行测试
3. **网络连接**: 确保网络连接稳定，必要时使用代理
4. **错误处理**: 实现完善的错误处理和重连机制
5. **风险控制**: 设置合理的仓位和止损策略
6. **频率限制**: 注意API调用频率限制

## 错误处理

```typescript
// 监听错误事件
gateway.on('error', (error) => {
  console.error('网关错误:', error);
  // 实现重连逻辑
});

// 监听日志事件
gateway.on('log', (message) => {
  console.log('网关日志:', message);
});
```

## 扩展功能

网关支持扩展以下功能：

1. **自定义指标**: 在数据处理中添加技术指标计算
2. **风险管理**: 实现仓位管理和风险控制
3. **策略集成**: 与回测引擎集成进行策略测试
4. **数据存储**: 将实时数据存储到数据库
5. **监控告警**: 添加异常监控和告警机制

## 许可证

本项目基于MIT许可证开源。
