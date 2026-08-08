import { Strategy, param } from '../strategy';

/**
 * 参数类型测试策略
 * 用于测试所有参数类型在策略参数弹窗中的展示效果
 */
export default class ParamTestStrategy extends Strategy {
  @param({ type: Number, default: 14 })
  rsiPeriod!: number;

  @param({ type: String, default: 'BTCUSDT' })
  symbolName!: string;

  @param({ type: Boolean, default: true })
  enableLogging!: boolean;
}
