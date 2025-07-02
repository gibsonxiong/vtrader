# VTrader CTA回测引擎

一个功能完整的CTA策略回测引擎，参考vnpy设计，使用TypeScript实现。

## 功能特性

- 🚀 **高性能回测**: 支持K线和Tick数据回测
- 📊 **丰富的技术指标**: 内置SMA、EMA、布林带、RSI、MACD、KDJ等常用指标
- 🎯 **策略模板**: 提供标准化的策略开发模板
- 📈 **完整的结果分析**: 包含收益、风险、回撤等全面的分析指标
- 💾 **多数据源支持**: 支持CSV文件、数据库、API等多种数据源
- ⚡ **参数优化**: 内置参数优化功能
- 📝 **详细文档**: 完整的使用说明和示例代码

## 快速开始

### 1. 基本使用

```typescript
import { BacktestingEngine, BacktestingMode, DoubleMaStrategy, MockDataGenerator } from './index';

// 创建回测引擎
const engine = new BacktestingEngine();

// 设置回测参数
engine.setStartDate(new Date('2023-01-01'));
engine.setEndDate(new Date('2023-12-31'));
engine.setCapital(100000); // 初始资金
engine.setCommission(0.0003); // 手续费率
engine.setSlippage(0.0001); // 滑点
engine.setMode(BacktestingMode.BAR);

// 生成模拟数据
const mockData = MockDataGenerator.generateBars(
  'BTCUSDT',
  new Date('2023-01-01'),
  new Date('2023-12-31'),
  '1h',
  30000,
);

// 加载数据
engine.setDatabase(mockData);

// 添加策略
const strategySetting = {
  fastWindow: 10,
  slowWindow: 20,
  fixedSize: 1,
};

engine.addStrategy(DoubleMaStrategy, 'DoubleMa', 'BTCUSDT', strategySetting);

// 运行回测
const result = engine.runBacktesting();
console.log('回测完成:', result);
```

### 2. 结果分析

```typescript
import { ResultAnalyzer } from './index';

// 获取交易记录和权益曲线
const trades = engine.getTrades();
const equityHistory = engine.getEquityHistory();

// 创建分析器
const analyzer = new ResultAnalyzer(trades, equityHistory);

// 执行分析
const analysis = analyzer.analyze();

// 生成报告
console.log(analyzer.generateReport());

// 获取详细指标
console.log('夏普比率:', analysis.riskMetrics.sharpeRatio);
console.log('最大回撤:', analysis.drawdownAnalysis.maxDrawdownPercent);
console.log('胜率:', analysis.tradeStats.winRate);
```

### 3. 自定义策略

```typescript
import { CtaTemplate, BarData, TickData, TechnicalIndicators } from './index';

class MyStrategy extends CtaTemplate {
  // 策略参数
  public period: number = 20;
  public threshold: number = 2;

  // 参数列表
  public parameters: string[] = ['period', 'threshold'];

  // 策略变量
  public sma: number = 0;
  public std: number = 0;

  // 变量列表
  public variables: string[] = ['sma', 'std'];

  private closeData: number[] = [];

  public onBar(bar: BarData): void {
    // 收集数据
    this.closeData.push(bar.closePrice);

    if (this.closeData.length > this.period * 2) {
      this.closeData.shift();
    }

    // 计算指标
    if (this.closeData.length >= this.period) {
      const smaArray = TechnicalIndicators.sma(this.closeData, this.period);
      this.sma = smaArray[smaArray.length - 1];

      // 计算标准差
      const recent = this.closeData.slice(-this.period);
      const variance =
        recent.reduce((sum, price) => sum + Math.pow(price - this.sma, 2), 0) / this.period;
      this.std = Math.sqrt(variance);

      // 交易逻辑
      const currentPrice = bar.closePrice;
      const upperBand = this.sma + this.threshold * this.std;
      const lowerBand = this.sma - this.threshold * this.std;

      if (currentPrice > upperBand && this.pos <= 0) {
        if (this.pos < 0) this.cover(0, Math.abs(this.pos));
        this.buy(0, 1);
      } else if (currentPrice < lowerBand && this.pos >= 0) {
        if (this.pos > 0) this.sell(0, this.pos);
        this.short(0, 1);
      }
    }
  }

  public onTick(tick: TickData): void {
    // Tick数据处理逻辑
  }
}
```

### 4. 数据加载

#### CSV数据

```typescript
import { DataLoaderFactory, DataSourceType } from './index';

const config = {
  symbol: 'AAPL',
  startDate: new Date('2023-01-01'),
  endDate: new Date('2023-12-31'),
  interval: '1d',
  sourceType: DataSourceType.CSV,
  sourcePath: './data/AAPL_2023.csv',
};

const csvConfig = {
  delimiter: ',',
  hasHeader: true,
  dateFormat: 'YYYY-MM-DD',
  columns: {
    datetime: 0,
    open: 1,
    high: 2,
    low: 3,
    close: 4,
    volume: 5,
  },
};

const loader = DataLoaderFactory.createLoader(config, { csvConfig });
const data = await loader.loadBars();
```

#### 数据库数据

```typescript
const config = {
  symbol: 'BTCUSDT',
  startDate: new Date('2023-01-01'),
  endDate: new Date('2023-12-31'),
  interval: '1h',
  sourceType: DataSourceType.DATABASE,
};

const loader = DataLoaderFactory.createLoader(config, {
  connectionString: 'postgresql://user:pass@localhost:5432/trading',
});
const data = await loader.loadBars();
```

### 5. 参数优化

```typescript
import { BacktestExample } from './index';

const example = new BacktestExample();

// 运行参数优化
await example.runParameterOptimization();
```

## 核心组件

### BacktestingEngine

回测引擎核心类，负责:

- 数据管理
- 策略执行
- 订单撮合
- 结果统计

### CtaTemplate

策略模板基类，提供:

- 标准化接口
- 基础交易方法
- 事件处理机制

### TechnicalIndicators

技术指标工具类，包含:

- SMA (简单移动平均)
- EMA (指数移动平均)
- 布林带
- RSI
- MACD
- KDJ

### ResultAnalyzer

结果分析器，计算:

- 收益指标
- 风险指标
- 回撤分析
- 交易统计

### DataLoader

数据加载器，支持:

- CSV文件
- 数据库
- API接口
- 模拟数据生成

## 回测指标说明

### 收益指标

- **总收益**: 绝对收益金额
- **总收益率**: 相对收益百分比
- **年化收益率**: 按年计算的收益率
- **月度收益**: 每月收益统计
- **年度收益**: 每年收益统计

### 风险指标

- **最大回撤**: 从峰值到谷值的最大跌幅
- **夏普比率**: 风险调整后收益
- **索提诺比率**: 下行风险调整收益
- **卡玛比率**: 回撤调整收益
- **波动率**: 收益率标准差
- **VaR**: 风险价值
- **CVaR**: 条件风险价值

### 交易指标

- **总交易次数**: 完成的交易数量
- **胜率**: 盈利交易占比
- **平均盈利**: 盈利交易平均收益
- **平均亏损**: 亏损交易平均损失
- **盈亏比**: 总盈利与总亏损比值
- **期望收益**: 每笔交易期望收益

## 示例策略

### 双均线策略 (DoubleMaStrategy)

经典的双均线交叉策略:

- 快线上穿慢线时买入
- 快线下穿慢线时卖出
- 支持参数优化

### 三均线策略 (TripleMaStrategy)

基于三条均线排列的趋势策略:

- 多头排列时做多
- 空头排列时做空
- 震荡时平仓

## 最佳实践

### 1. 策略开发

```typescript
// 继承CtaTemplate
class MyStrategy extends CtaTemplate {
  // 明确定义参数和变量
  public parameters: string[] = ['param1', 'param2'];
  public variables: string[] = ['var1', 'var2'];

  // 实现必要的事件处理
  public onBar(bar: BarData): void {
    // 策略逻辑
  }

  // 添加适当的日志
  protected writeLog(msg: string): void {
    super.writeLog(`[${this.strategyName}] ${msg}`);
  }
}
```

### 2. 数据处理

```typescript
// 验证数据完整性
if (!this.validateData(data)) {
  throw new Error('数据验证失败');
}

// 处理缺失数据
const cleanData = data.filter(
  (bar) => bar.openPrice > 0 && bar.highPrice >= bar.lowPrice && bar.volume >= 0,
);
```

### 3. 风险控制

```typescript
// 设置合理的手续费和滑点
engine.setCommission(0.0003); // 0.03%
engine.setSlippage(0.0001); // 0.01%

// 限制单笔交易大小
const maxSize = (this.capital * 0.1) / bar.closePrice;
const tradeSize = Math.min(this.fixedSize, maxSize);
```

### 4. 性能优化

```typescript
// 限制数据缓存大小
if (this.dataCache.length > this.maxCacheSize) {
  this.dataCache.shift();
}

// 避免重复计算
if (this.lastCalculateTime !== bar.datetime) {
  this.calculateIndicators();
  this.lastCalculateTime = bar.datetime;
}
```

## 注意事项

1. **数据质量**: 确保使用高质量、完整的历史数据
2. **过拟合**: 避免过度优化参数，保留样本外测试
3. **交易成本**: 考虑实际的手续费、滑点和冲击成本
4. **市场环境**: 不同市场环境下策略表现可能差异很大
5. **风险管理**: 设置合理的止损和仓位管理规则

## 扩展开发

### 添加新的技术指标

```typescript
// 在TechnicalIndicators类中添加新指标
static newIndicator(data: number[], period: number): number[] {
  // 指标计算逻辑
  return result;
}
```

### 添加新的数据源

```typescript
// 继承DataLoader基类
class CustomDataLoader extends DataLoader {
  public async loadBars(): Promise<BarData[]> {
    // 自定义数据加载逻辑
    return bars;
  }
}
```

### 添加新的分析指标

```typescript
// 在ResultAnalyzer中添加新的分析方法
private calculateCustomMetric(): number {
  // 自定义指标计算
  return metric;
}
```

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request来改进这个项目。

## 联系方式

如有问题或建议，请联系VTrader团队。
